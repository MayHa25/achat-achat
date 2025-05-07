import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar, Plus, X, Save, Clock } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';
import ReactCalendar from 'react-calendar';
import useStore from '../../store/useStore';

const AvailabilityPage: React.FC = () => {
  const { t } = useTranslation();
  const { availabilities, updateAvailability, blockedTimes, addBlockedTime, deleteBlockedTime } = useStore();
  
  const [activeTab, setActiveTab] = useState<'hours' | 'blocked'>('hours');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddingBlocked, setIsAddingBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  
  // For demo, we'll create mock business hours
  const initialBusinessHours = [
    { id: 'day-0', dayOfWeek: 0, startTime: '09:00', endTime: '18:00', available: true },
    { id: 'day-1', dayOfWeek: 1, startTime: '09:00', endTime: '18:00', available: true },
    { id: 'day-2', dayOfWeek: 2, startTime: '09:00', endTime: '18:00', available: true },
    { id: 'day-3', dayOfWeek: 3, startTime: '09:00', endTime: '18:00', available: true },
    { id: 'day-4', dayOfWeek: 4, startTime: '09:00', endTime: '18:00', available: true },
    { id: 'day-5', dayOfWeek: 5, startTime: '09:00', endTime: '14:00', available: true },
    { id: 'day-6', dayOfWeek: 6, startTime: '00:00', endTime: '00:00', available: false }
  ];
  
  const [businessHours, setBusinessHours] = useState(initialBusinessHours);
  
  const getDayName = (dayIndex: number) => {
    const days = [
      t('sunday'),
      t('monday'),
      t('tuesday'),
      t('wednesday'),
      t('thursday'),
      t('friday'),
      t('saturday')
    ];
    return days[dayIndex];
  };
  
  const handleHoursChange = (dayIndex: number, field: 'startTime' | 'endTime' | 'available', value: string | boolean) => {
    const updated = businessHours.map((day) => {
      if (day.dayOfWeek === dayIndex) {
        return { ...day, [field]: value };
      }
      return day;
    });
    setBusinessHours(updated);
  };
  
  const handleSaveHours = () => {
    // In a real app, we would save to the database
    alert('שעות העבודה נשמרו בהצלחה!');
  };
  
  const handleAddBlockedTime = () => {
    if (!selectedDate) return;
    
    // For demo purposes - in a real app this would save to the database
    const newBlockedTime = {
      id: `blocked-${Date.now()}`,
      businessId: 'business-1',
      startTime: selectedDate,
      endTime: new Date(selectedDate.getTime() + 60 * 60 * 1000), // 1 hour later
      reason: blockReason || 'חופשה'
    };
    
    addBlockedTime(newBlockedTime);
    setIsAddingBlocked(false);
    setBlockReason('');
  };
  
  // Mock blocked times for demo
  const mockBlockedTimes = [
    {
      id: 'blocked-1',
      businessId: 'business-1',
      startTime: new Date(new Date().setDate(new Date().getDate() + 3)),
      endTime: new Date(new Date().setDate(new Date().getDate() + 3)),
      reason: 'חופשה'
    },
    {
      id: 'blocked-2',
      businessId: 'business-1',
      startTime: new Date(new Date().setDate(new Date().getDate() + 7)),
      endTime: new Date(new Date().setDate(new Date().getDate() + 10)),
      reason: 'השתלמות מקצועית'
    }
  ];
  
  const allBlockedTimes = blockedTimes.length > 0 ? blockedTimes : mockBlockedTimes;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ניהול זמני פעילות</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('hours')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm md:text-base ${
                activeTab === 'hours'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('business_hours')}
            </button>
            <button
              onClick={() => setActiveTab('blocked')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm md:text-base ${
                activeTab === 'blocked'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('blocked_times')}
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {/* Business Hours Tab */}
          {activeTab === 'hours' && (
            <div>
              <p className="text-gray-600 mb-4">
                הגדר את שעות הפעילות הרגילות של העסק שלך לכל יום בשבוע.
              </p>
              
              <div className="space-y-4 mb-6">
                {businessHours.map((day) => (
                  <div key={day.id} className="flex flex-wrap items-center p-3 border rounded-md">
                    <div className="w-32 font-medium">{getDayName(day.dayOfWeek)}</div>
                    
                    <div className="flex items-center mr-4">
                      <input
                        type="checkbox"
                        id={`available-${day.dayOfWeek}`}
                        checked={day.available}
                        onChange={(e) => handleHoursChange(day.dayOfWeek, 'available', e.target.checked)}
                        className="ml-2"
                      />
                      <label htmlFor={`available-${day.dayOfWeek}`}>פתוח</label>
                    </div>
                    
                    {day.available && (
                      <div className="flex flex-wrap gap-4 mr-auto">
                        <div className="flex items-center">
                          <label htmlFor={`start-${day.dayOfWeek}`} className="text-sm ml-2">
                            {t('start_time')}:
                          </label>
                          <input
                            type="time"
                            id={`start-${day.dayOfWeek}`}
                            value={day.startTime}
                            onChange={(e) => handleHoursChange(day.dayOfWeek, 'startTime', e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1"
                          />
                        </div>
                        <div className="flex items-center">
                          <label htmlFor={`end-${day.dayOfWeek}`} className="text-sm ml-2">
                            {t('end_time')}:
                          </label>
                          <input
                            type="time"
                            id={`end-${day.dayOfWeek}`}
                            value={day.endTime}
                            onChange={(e) => handleHoursChange(day.dayOfWeek, 'endTime', e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleSaveHours}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <Save className="w-5 h-5 ml-2" />
                {t('save')}
              </button>
            </div>
          )}
          
          {/* Blocked Times Tab */}
          {activeTab === 'blocked' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">
                  הגדר ימים או שעות שבהם העסק סגור, כגון חופשות או ימי חג.
                </p>
                <button
                  onClick={() => setIsAddingBlocked(!isAddingBlocked)}
                  className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                >
                  {isAddingBlocked ? (
                    <X className="w-5 h-5 ml-1" />
                  ) : (
                    <Plus className="w-5 h-5 ml-1" />
                  )}
                  {isAddingBlocked ? t('cancel') : t('add_blocked_time')}
                </button>
              </div>
              
              {isAddingBlocked && (
                <div className="bg-gray-50 p-4 rounded-md mb-6 border border-gray-200">
                  <h3 className="font-medium mb-4">הוסף זמן חסום</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        בחר תאריך
                      </label>
                      <div className="border border-gray-200 rounded-md overflow-hidden">
                        <ReactCalendar
                          onChange={setSelectedDate}
                          value={selectedDate}
                          minDate={new Date()}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="mb-4">
                        <label htmlFor="blockReason" className="block text-sm font-medium text-gray-700 mb-1">
                          סיבה (אופציונלי)
                        </label>
                        <input
                          id="blockReason"
                          type="text"
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          className="w-full border border-gray-300 rounded-md px-4 py-2"
                          placeholder="לדוגמה: חופשה, יום הולדת, חג..."
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          תאריך נבחר
                        </label>
                        <div className="bg-white border border-gray-300 rounded-md px-4 py-2 text-gray-700">
                          {format(selectedDate, 'EEEE, d בMMMM yyyy', { locale: he })}
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleAddBlockedTime}
                        className="w-full mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                      >
                        {t('add_blocked_time')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="font-medium mb-4">זמנים חסומים</h3>
                
                {allBlockedTimes.length > 0 ? (
                  <div className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
                    {allBlockedTimes.map((blockedTime) => (
                      <div key={blockedTime.id} className="flex justify-between items-center px-4 py-3 bg-white">
                        <div>
                          <div className="flex items-center">
                            <Calendar className="w-5 h-5 text-gray-500 ml-2" />
                            <span className="font-medium">
                              {format(blockedTime.startTime, 'd בMMMM', { locale: he })}
                              {' - '}
                              {format(blockedTime.endTime, 'd בMMMM yyyy', { locale: he })}
                            </span>
                          </div>
                          {blockedTime.reason && (
                            <p className="text-sm text-gray-500 mr-7">{blockedTime.reason}</p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteBlockedTime(blockedTime.id)}
                          className="text-error-600 hover:text-error-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-md border border-gray-200">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">אין זמנים חסומים</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityPage;