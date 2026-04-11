import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Ship, Ticket, LogOut, User, Menu, X, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/passenger', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/passenger/book', icon: Ship, label: 'Book a Trip' },
  { to: '/passenger/bookings', icon: Ticket, label: 'My Bookings' },
];

export default function PassengerLayout() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPrivacyAct, setShowPrivacyAct] = useState(false);

  const [privacyChecked, setPrivacyChecked] = useState(false);

  useEffect(() => {
    // Show Privacy Act modal on every login session
    const accepted = sessionStorage.getItem('monstar_privacy_accepted');
    if (!accepted) setShowPrivacyAct(true);
  }, []);

  function acceptPrivacyAct() {
    sessionStorage.setItem('monstar_privacy_accepted', 'true');
    setShowPrivacyAct(false);
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-6 py-5 border-b border-navy-100">
        <div className="w-9 h-9 bg-navy-900 rounded-xl flex items-center justify-center flex-shrink-0">
          <img src="/assets/logo2.png" className="w-5 h-5" alt="logo" />
        </div>
        <div>
          <span className="font-display font-bold text-navy-900 text-base leading-none block">MonStar</span>
          <span className="text-xs text-navy-400">Ship Lines</span>
        </div>
      </div>

      <div className="px-4 py-4 mx-3 mt-4 bg-navy-50 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-navy-200 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-navy-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy-900 truncate">{userProfile?.displayName ?? 'Passenger'}</p>
            <p className="text-xs text-navy-400 truncate">{userProfile?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider px-3 mb-3">Navigation</p>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'text-navy-600 hover:bg-navy-100 hover:text-navy-900'
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-navy-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-navy-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Privacy Act / Terms & Conditions Modal ── */}
      {showPrivacyAct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col shadow-2xl" style={{ maxHeight: 'calc(100svh - 2rem)' }}>
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-5 border-b border-navy-100 text-center">
              <div className="w-14 h-14 bg-navy-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-7 h-7 text-gold-400" />
              </div>
              <h2 className="font-display font-bold text-navy-900 text-lg">MonStar Ship Online Ticketing and Booking System</h2>
              <p className="text-xs text-navy-500 mt-1">Terms & Conditions and Privacy Policy</p>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 text-sm text-navy-700 leading-relaxed space-y-4">

              <p className="text-xs text-navy-500 italic">By using this system, you agree to the following:</p>

              {/* Section 1 */}
              <h3 className="font-bold text-navy-900 text-base">1. Terms and Conditions</h3>

              <div>
                <h4 className="font-semibold text-navy-900 mb-1">1.1 Use of the System</h4>
                <ul className="list-disc pl-5 space-y-1 text-navy-600">
                  <li>Users must provide correct information when registering and booking.</li>
                  <li>Each user is responsible for keeping their account secure.</li>
                  <li>Unauthorized use of accounts is not allowed.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-navy-900 mb-1">1.2 Booking Rules</h4>
                <ul className="list-disc pl-5 space-y-1 text-navy-600">
                  <li>All bookings depend on available schedules and seats.</li>
                  <li>The system is for reservation only (no payment processing).</li>
                  <li>Bookings may be updated or canceled depending on system rules.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-navy-900 mb-1">1.3 User Behavior</h4>
                <p className="text-navy-600 mb-1">Users must NOT:</p>
                <ul className="list-disc pl-5 space-y-1 text-navy-600">
                  <li>Give false information</li>
                  <li>Try to hack or damage the system</li>
                  <li>Use other people's accounts</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-navy-900 mb-1">1.4 System Limitations</h4>
                <ul className="list-disc pl-5 space-y-1 text-navy-600">
                  <li>The system may not always be available due to maintenance or technical issues.</li>
                  <li>The system is not responsible for user mistakes in booking.</li>
                </ul>
              </div>

              {/* Section 2 */}
              <h3 className="font-bold text-navy-900 text-base pt-2">2. Privacy Policy (Data Privacy Act of 2012)</h3>

              <div>
                <h4 className="font-semibold text-navy-900 mb-1">2.1 Information Collected</h4>
                <p className="text-navy-600 mb-1">The system collects:</p>
                <ul className="list-disc pl-5 space-y-1 text-navy-600">
                  <li>Name</li>
                  <li>Contact information (email, phone number)</li>
                  <li>Booking details (schedule, seat, destination)</li>
                  <li>System logs (IP address, device info)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-navy-900 mb-1">2.2 Purpose of Data</h4>
                <p className="text-navy-600 mb-1">Your data is used for:</p>
                <ul className="list-disc pl-5 space-y-1 text-navy-600">
                  <li>Creating and managing bookings</li>
                  <li>User identification</li>
                  <li>System improvement</li>
                  <li>Customer support</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-navy-900 mb-1">2.3 Data Protection</h4>
                <ul className="list-disc pl-5 space-y-1 text-navy-600">
                  <li>Data is stored securely in the system.</li>
                  <li>Only authorized staff can access user information.</li>
                  <li>Data is protected using security measures like encryption.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-navy-900 mb-1">2.4 Data Sharing</h4>
                <ul className="list-disc pl-5 space-y-1 text-navy-600">
                  <li>Data is only shared with authorized staff or government agencies.</li>
                  <li>The system does NOT sell or share your data with other companies.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-navy-900 mb-1">2.5 User Rights</h4>
                <p className="text-navy-600 mb-1">Users can:</p>
                <ul className="list-disc pl-5 space-y-1 text-navy-600">
                  <li>Access their data</li>
                  <li>Correct wrong information</li>
                  <li>Request cancellation</li>
                </ul>
              </div>

              {/* Section 3 */}
              <h3 className="font-bold text-navy-900 text-base pt-2">3. User Consent</h3>
              <p className="text-navy-600">Before using the system, users must agree to the policy.</p>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-navy-100 bg-navy-50 rounded-b-2xl space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyChecked}
                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                  className="w-4 h-4 accent-navy-900 mt-0.5 flex-shrink-0"
                />
                <span className="text-sm text-navy-700">
                  I agree to the <strong>Terms and Conditions</strong> and <strong>Privacy Policy</strong> of MonStar Ship Online Ticketing and Booking System.
                </span>
              </label>
              <button
                onClick={acceptPrivacyAct}
                disabled={!privacyChecked}
                className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-5 h-5" />
                I Accept
              </button>
              <p className="text-xs text-navy-400 text-center">You must accept to continue using the system.</p>
            </div>
          </div>
        </div>
      )}

      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-navy-100 fixed h-full z-30">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-white flex flex-col h-full shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-navy-100">
              <X className="w-4 h-4 text-navy-600" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-navy-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-navy-900 rounded-lg flex items-center justify-center">
              <img src="/assets/logo2.png" className="w-4 h-4" alt="logo" />
            </div>
            <span className="font-display font-bold text-navy-900">MonStar</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-navy-100 rounded-lg">
            <Menu className="w-5 h-5 text-navy-700" />
          </button>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
