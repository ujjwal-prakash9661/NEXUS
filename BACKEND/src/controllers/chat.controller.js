const Message = require('../models/Message')
const User = require('../models/User')
const socketStore = require('../socketInstance')
const redis = require('../services/redis.service')
const audit = require('../services/audit.service')
// const { askNexus } = require("../ai/nexusAI.service")
// const { applyRisk } = require("../ai/riskEngine.service")

function analyzeMessage(content) {
  // AI analysis disabled
  return 0
}

async function feedAI(message) {
  // AI learning disabled
}

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, attachment } = req.body

    if (!receiverId || (!content && !attachment))
      return res.status(400).json({ message: 'receiverId and content or attachment required' })

    if (req.user.status !== 'APPROVED')
      return res.status(403).json({ message: 'Access denied' })

    const receiver = await User.findById(receiverId)
    if (!receiver) return res.status(404).json({ message: 'Receiver not found' })

    // const riskPoints = content ? analyzeMessage(content) : 0
    // if (riskPoints > 0) {
    //   await applyRisk(req.user._id, "SUSPICIOUS_MESSAGE", riskPoints)
    // }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content: content || (attachment ? `Sent a file: ${attachment.filename}` : ""),
      attachment,
      status: 'PENDING'
    })


    await audit.log(req.user._id, "MESSAGE_SENT", receiverId, req.ip)

    // await feedAI(message)

    let aiResponse = null;
    // if (content) {
    //   try {
    //     aiResponse = await askNexus(req.user._id, content)
    //   } catch (error) {
    //     console.error("AI Response Error:", error.message);
    //   }
    // }

    // await applyRisk(req.user._id, "MESSAGE_ACTIVITY", 1)

    const io = req.app.get('io')

    if (receiver.online) {
      io.to(receiverId).emit('incoming-message', message)
      message.status = 'DELIVERED'
      await message.save()
    } else {
      await redis.rPush(`queue:user:${receiverId}`, message._id.toString())
    }

    res.json({ message: "Message processed", ai: aiResponse, data: message })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to send message' })
  }
}

exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.query;
    const myId = req.user._id;

    if (!userId) {
      return res.status(400).json({ message: "User ID query param required" });
    }

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
}

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    // Aggregate to find unique conversation partners
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userId] },
              "$receiver",
              "$sender"
            ]
          },
          lastMessage: { $first: "$$ROOT" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $unwind: "$userDetails"
      },
      {
        $project: {
          user: {
            _id: "$userDetails._id",
            name: "$userDetails.name",
            email: "$userDetails.email",
            nexusId: "$userDetails.nexusId",
            online: "$userDetails.online",
            avatar: "$userDetails.avatar"
          },
          lastMessage: 1
        }
      },
      {
        $sort: { "lastMessage.createdAt": -1 }
      }
    ]);

    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
}

exports.getOnlineUsers = async (req, res) => {
  try {
    const users = await User.find({ online: true, _id: { $ne: req.user._id } })
      .select("_id name nexusId email online avatar")
      .limit(20);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch online users" });
  }
}

exports.lookupUser = async (req, res) => {
  try {
    const { nexusId } = req.query;
    if (!nexusId) return res.status(400).json({ message: "Nexus ID required" });

    // Case-insensitive search, handle potential missing prefix if user just types numbers
    const query = {
      nexusId: { $regex: new RegExp(`^${nexusId}$`, 'i') }
    };

    const user = await User.findOne(query).select("name nexusId avatar _id online publicKey");
    if (!user) {
      // Try adding NEX- prefix if not present
      if (!nexusId.toUpperCase().startsWith('NEX-')) {
        const altUser = await User.findOne({ nexusId: { $regex: new RegExp(`^NEX-${nexusId}$`, 'i') } }).select("name nexusId avatar _id online publicKey");
        if (altUser) return res.json(altUser);
      }
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    // Assuming backend serves 'uploads' folder statically or via a route
    // For now returning relative path. Ensure 'uploads' folder exists in public/static
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.originalname, size: req.file.size });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: "File upload failed" });
  }
}


exports.markMessagesAsSeen = async (req, res) => {
  try {
    const { senderId } = req.body;
    const myId = req.user._id;

    if (!senderId) {
      return res.status(400).json({ message: "Sender ID required" });
    }

    await Message.updateMany(
      { sender: senderId, receiver: myId, status: { $ne: 'SEEN' } },
      { $set: { status: 'SEEN' } }
    );

    // Notify sender via socket
    const io = req.app.get('io');
    io.to(senderId).emit('messages-seen', { viewerId: myId });

    res.json({ message: "Messages marked as seen" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to mark messages as seen" });
  }
}
