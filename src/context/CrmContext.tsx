import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import type { Claim, User, ViewState } from '../types';
import { INITIAL_CLAIMS, USERS } from '../data';

interface Notification {
    id: string;
    text: string;
    urgent?: boolean;
}

interface CrmContextType {
    currentUser: User;
    setCurrentUser: (user: User) => void;
    currentView: ViewState;
    setCurrentView: (view: ViewState) => void;
    claims: Claim[];
    setClaims: (claims: Claim[]) => void;
    selectedClaim: Claim | null;
    setSelectedClaim: (claim: Claim | null) => void;
    users: User[];
    setUsers: (users: User[]) => void;
    notifications: Notification[];
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export function CrmProvider({ children }: { children: ReactNode }) {
    const [users, setUsers] = useState<User[]>(USERS);
    const [currentUser, setCurrentUser] = useState<User>(users[0]);
    const [currentView, setCurrentView] = useState<ViewState>('dashboard');
    const [claims, setClaims] = useState<Claim[]>(INITIAL_CLAIMS);
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

    const notifications = useMemo(() => {
        const notifs: Notification[] = [];
        claims.forEach(c => {
            if (c.status === 'Nuevo') {
                notifs.push({ id: c.id, text: `Nuevo reclamo sin asignar/revisar: ${c.id}` });
            }
            const hoursOld = (new Date().getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60);
            if (hoursOld > 48 && (c.status === 'Nuevo' || c.status === 'En Revisión')) {
                notifs.push({ id: `${c.id}-sla`, text: `SLA Vencido (>48h) en ticket ${c.id}`, urgent: true });
            }
        });
        return notifs;
    }, [claims]);

    return (
        <CrmContext.Provider value={{
            currentUser, setCurrentUser,
            currentView, setCurrentView,
            claims, setClaims,
            selectedClaim, setSelectedClaim,
            users, setUsers,
            notifications
        }}>
            {children}
        </CrmContext.Provider>
    );
}

export function useCrm() {
    const context = useContext(CrmContext);
    if (!context) throw new Error("useCrm must be used within a CrmProvider");
    return context;
}
