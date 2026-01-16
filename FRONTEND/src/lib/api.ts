export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface HealthResponse {
    status: string;
    service: string;
    timestamp: string;
}

export const checkBackendHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_URL}/api/health`);
        if (!response.ok) return false;
        const data: HealthResponse = await response.json();
        return data.status === 'OK';
    } catch (error) {
        console.error('Backend health check failed:', error);
        return false;
    }
};
