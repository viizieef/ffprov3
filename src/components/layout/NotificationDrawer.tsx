import React from 'react';
import { useFarm } from '../../context/FarmContext';
import { X, AlertTriangle, Syringe, UserPlus, CheckCircle, ArrowRight } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onNavigate }) => {
  const { getLowStockAlerts, getUpcomingVaccines, users, currentUser, approveUser, permissions } = useFarm();

  if (!isOpen) return null;

  const lowFeeds = getLowStockAlerts();
  const upcomingVaccines = getUpcomingVaccines();
  const pendingUsers = users.filter(u => u.status === 'pending');

  const totalAlerts = lowFeeds.length + upcomingVaccines.length + (permissions.canApproveUsers ? pendingUsers.length : 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 bg-teal-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500 text-teal-950 flex items-center justify-center font-bold text-sm">
                {totalAlerts}
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Farm Alerts & Tasks</h3>
                <p className="text-xs text-teal-300/80">Live operational notifications</p>
              </div>
            </div>
            <button
              id="close-notifications-btn"
              onClick={onClose}
              className="p-1.5 text-teal-400 hover:text-white hover:bg-teal-900 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Feed Stock Low Alerts */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Low Feed Stock Warnings</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {lowFeeds.length}
                </span>
              </div>

              {lowFeeds.length === 0 ? (
                <div className="p-3.5 bg-teal-50/70 border border-teal-100 rounded-xl text-xs text-teal-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-teal-600" />
                  <span>All feed stocks are sufficient (&gt; 4 bags available).</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {lowFeeds.map(feed => (
                    <div
                      key={feed.feedType}
                      className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-sm text-rose-950 flex items-center gap-1.5">
                          <span>{feed.feedType}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-800 uppercase">
                            Critical Level (≤ 4 bags)
                          </span>
                        </div>
                        <p className="text-xs text-rose-700 mt-1">
                          Current: <strong className="font-semibold">{feed.currentStockBags} bags</strong> ({feed.currentStockKg} kg)
                        </p>
                      </div>
                      {permissions.canAddFeedStock && (
                        <button
                          onClick={() => {
                            onClose();
                            onNavigate('feed_inventory');
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1"
                        >
                          <span>Restock</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Vaccine & Medication Alerts */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider">
                  <Syringe className="w-4 h-4" />
                  <span>Vaccine / Medication Schedule</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {upcomingVaccines.length}
                </span>
              </div>

              {upcomingVaccines.length === 0 ? (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  No pending vaccinations due for active flocks this week.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {upcomingVaccines.map(alert => (
                    <div
                      key={alert.id}
                      className={`p-3.5 border rounded-xl ${
                        alert.urgency === 'due_now'
                          ? 'bg-amber-50/70 border-amber-200'
                          : 'bg-teal-50/60 border-teal-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-teal-600 text-white shadow-2xs">
                              {alert.houseNumber}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              Age: Wk {alert.flockAgeWeeks}
                            </span>
                            {alert.urgency === 'due_now' && (
                              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded">
                                Due This Week
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-sm text-slate-900 mt-1.5">
                            {alert.productName}
                          </h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Target: <span className="font-medium">{alert.diseaseTarget}</span> • Method: <span className="font-medium">{alert.method}</span>
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => {
                            onClose();
                            onNavigate('medicine');
                          }}
                          className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                        >
                          <span>Log Administration</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending User Registrations */}
            {permissions.canApproveUsers && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase tracking-wider">
                    <UserPlus className="w-4 h-4" />
                    <span>Pending User Approvals</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    {pendingUsers.length}
                  </span>
                </div>

                {pendingUsers.length === 0 ? (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                    No pending registration requests.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingUsers.map(user => (
                      <div
                        key={user.id}
                        className="p-3.5 bg-teal-50/50 border border-teal-200 rounded-xl"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm text-slate-900">{user.fullName}</p>
                            <p className="text-xs text-teal-700 font-medium">
                              @{user.username} • Role: <span className="font-bold uppercase">{user.role}</span>
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Contact: {user.contactNumber || 'N/A'} • {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button
                            onClick={() => approveUser(user.id)}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              onClose();
                              onNavigate('settings');
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
