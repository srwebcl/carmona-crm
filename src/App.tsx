import { CrmProvider, useCrm } from './context/CrmContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ClaimsList } from './components/ClaimsList';
import { ClaimDetail } from './components/ClaimDetail';
import { SimulationForm } from './components/SimulationForm';
import { TeamManagement } from './components/TeamManagement';

function MainContent() {
    const { currentView } = useCrm();

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[40%] rounded-full bg-purple-100/50 blur-[100px]"></div>
            </div>

            <Sidebar />
            
            <div className="flex-1 flex flex-col h-screen relative z-10">
                <Header />
                <main className="flex-1 overflow-auto p-6 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {currentView === 'dashboard' && <Dashboard />}
                        {currentView === 'claims' && <ClaimsList />}
                        {currentView === 'detail' && <ClaimDetail />}
                        {currentView === 'simulate' && <SimulationForm />}
                        {currentView === 'team' && <TeamManagement />}
                    </div>
                </main>
            </div>
        </div>
    );
}

function App() {
    return (
        <CrmProvider>
            <MainContent />
        </CrmProvider>
    );
}

export default App;
