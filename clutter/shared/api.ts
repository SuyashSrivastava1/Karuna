// ─── Karuna Shared API Client ───────────────────────────────────────────────
// All frontend pages import from this file to talk to the backend.

export const API_BASE = "http://localhost:5000/api";

// ── Token helpers ──

export const getToken = (): string | null =>
    localStorage.getItem("karuna_token");

export const setToken = (token: string): void =>
    localStorage.setItem("karuna_token", token);

export const clearToken = (): void =>
    localStorage.removeItem("karuna_token");

export const getAuthHeaders = (): Record<string, string> => {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

// ── Core request helper ──

export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    status: number;
}

async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    auth = true
): Promise<ApiResponse<T>> {
    try {
        const headers: Record<string, string> = auth
            ? getAuthHeaders()
            : { "Content-Type": "application/json" };

        const res = await fetch(`${API_BASE}${path}`, {
            method,
            headers,
            credentials: "include",
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            return { status: res.status, error: data?.message || `Error ${res.status}` };
        }
        return { status: res.status, data: data as T };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Network error";
        return { status: 0, error: message };
    }
}

export const api = {
    get: <T>(path: string, auth = true) => request<T>("GET", path, undefined, auth),
    post: <T>(path: string, body: unknown, auth = true) => request<T>("POST", path, body, auth),
    put: <T>(path: string, body: unknown, auth = true) => request<T>("PUT", path, body, auth),
    delete: <T>(path: string, auth = true) => request<T>("DELETE", path, undefined, auth),
};

// ── Auth ──

export interface AuthResponse {
    user?: { id: string; email?: string };
    session?: { access_token: string };
    message?: string;
}

export const authApi = {
    register: (body: {
        email: string; phone?: string; full_name: string; role: string;
        password?: string; blood_group?: string; date_of_birth?: string;
        profession?: string; medical_specialty?: string; pharmacy_address?: string;
    }) => api.post<AuthResponse>("/auth/register", body, false),

    login: (email: string) =>
        api.post<{ message: string }>("/auth/login", { email }, false),

    verifyOtp: (email: string, token: string) =>
        api.post<{ access_token: string; user: { id: string } }>("/auth/verify-otp", { email, token }, false),

    me: () => api.get<{ id: string; full_name: string; role: string; email: string }>("/auth/me"),

    updateMe: (body: Record<string, unknown>) => api.put("/auth/me", body),
};

// ── Sites ──

export interface Site {
    id: string;
    name: string;
    location: string;
    urgency_score: number;
    patient_count: number;
    latitude?: number;
    longitude?: number;
}

export const sitesApi = {
    list: () => api.get<Site[]>("/sites", false),
    getById: (id: string) => api.get<Site>(`/sites/${id}`, false),
    join: (id: string, body: Record<string, unknown>) => api.post(`/sites/${id}/join`, body),
};

// ── Volunteer ──

export interface VolunteerAssignment {
    assignment: { track: "NURSE" | "DRIVER" | "HELPER"; reason: string; suggested_tasks: string[] };
    user: Record<string, unknown>;
}

export const volunteerApi = {
    assign: (body: {
        profession: string; skills?: string; vehicle_availability?: string;
        medical_fitness?: string; medical_equipment?: string;
        availability_duration?: string; disaster_knowledge?: string; site_id?: string;
    }) => api.post<VolunteerAssignment>("/volunteer/assign", body),

    me: () => api.get<{ assigned_track: string; assignment_reason: string; current_site_id: string }>("/volunteer/me"),
};

// ── Patients ──

export interface Patient {
    id: string;
    tag_id: string;
    site_id: string;
    triage_level: "urgent" | "moderate" | "stable";
    diagnosis: string;
    vitals?: string;
    nurse_notes?: string;
    status?: string;
}

export const patientsApi = {
    list: (siteId: string) => api.get<Patient[]>(`/patients/${siteId}`),
    nextId: (siteId: string) => api.get<{ next_id: string; tag_id: string }>(`/patients/${siteId}/next-id`),
    create: (body: Partial<Patient>) => api.post<Patient>("/patients", body),
    update: (id: string, body: Partial<Patient>) => api.put<Patient>(`/patients/${id}`, body),
};

// ── Volunteer Todos ──

export interface Todo {
    id: string;
    site_id: string;
    task_description: string;
    patient_tag?: string;
    status: "pending" | "in_progress" | "done";
}

export const todosApi = {
    list: (siteId: string) => api.get<Todo[]>(`/volunteer-todos/${siteId}`),
    create: (body: Partial<Todo>) => api.post<Todo>("/volunteer-todos", body),
    update: (id: string, body: Partial<Todo>) => api.put<Todo>(`/volunteer-todos/${id}`, body),
    delete: (id: string) => api.delete(`/volunteer-todos/${id}`),
};

// ── Orders ──

export interface Order {
    id: string;
    site_id: string;
    patient_tag_id: string;
    urgency: string;
    items: { name: string; dosage: string; quantity: string }[];
    equipment_needed?: string;
    notes_for_nurse?: string;
    status: string;
    driver_name?: string;
    driver_phone?: string;
    eta?: string;
}

export const ordersApi = {
    list: (siteId: string) => api.get<Order[]>(`/orders/${siteId}`),
    pickup: (siteId: string) => api.get<Order[]>(`/orders/${siteId}/pickup`),
    create: (body: Partial<Order>) => api.post<Order>("/orders", body),
    update: (id: string, body: Partial<Order>) => api.put<Order>(`/orders/${id}`, body),
};

// ── Chatbot ──

export interface ChatMessage { role: "user" | "assistant"; content: string; }
export interface ChatResponse {
    response: string;
    nearest_site?: { name: string; location: string; distance_km: string } | null;
    emergency_numbers?: Record<string, string>;
}

export const chatbotApi = {
    chat: (message: string, history: ChatMessage[], location?: { lat: number; lng: number }) =>
        api.post<ChatResponse>("/chatbot/chat", { message, history, location }, false),
};
