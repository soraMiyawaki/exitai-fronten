// src/pages/Attendance.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';

interface DailyAttendance {
  day: number;
  start_time: string;
  end_time: string;
  is_holiday: boolean;
}

export default function Attendance() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize attendance data for the month
  const daysInMonth = new Date(year, month, 0).getDate();
  const [attendanceData, setAttendanceData] = useState<DailyAttendance[]>(() =>
    Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      start_time: '09:00',
      end_time: '18:00',
      is_holiday: false,
    }))
  );

  // Update attendance data when year/month changes
  const updateMonth = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
    const days = new Date(newYear, newMonth, 0).getDate();
    setAttendanceData(
      Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        start_time: '09:00',
        end_time: '18:00',
        is_holiday: false,
      }))
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Use environment-specific API URL
      const API_BASE = import.meta.env.VITE_API_BASE !== undefined
        ? import.meta.env.VITE_API_BASE
        : "http://127.0.0.1:8000";

      const response = await fetch(`${API_BASE}/api/attendance/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year,
          month,
          employee_name: employeeName,
          employee_id: employeeId,
          attendance_data: attendanceData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Excel');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `勤務管理表_${year}_${month.toString().padStart(2, '0')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Excelファイルの生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg)] p-4 md:p-6">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-[var(--fg)] mb-2">勤怠管理表作成</h1>
          <p className="text-sm text-[var(--muted)]">
            勤務時間を入力してExcelファイルを生成します
          </p>
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 md:p-6 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--fg)] mb-2">
                年
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => updateMonth(parseInt(e.target.value), month)}
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:ring-2 ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--fg)] mb-2">
                月
              </label>
              <select
                value={month}
                onChange={(e) => updateMonth(year, parseInt(e.target.value))}
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:ring-2 ring-brand"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}月
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--fg)] mb-2">
                社員番号（任意）
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="例: 12345"
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:ring-2 ring-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--fg)] mb-2">
                氏名（任意）
              </label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="例: 山田太郎"
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:ring-2 ring-brand"
              />
            </div>
          </div>
        </motion.div>

        {/* Calendar Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-4 md:p-6 mb-6"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-2 py-3 text-left font-medium text-[var(--fg)]">日付</th>
                  <th className="px-2 py-3 text-left font-medium text-[var(--fg)]">曜日</th>
                  <th className="px-2 py-3 text-left font-medium text-[var(--fg)]">休日</th>
                  <th className="px-2 py-3 text-left font-medium text-[var(--fg)]">出勤時刻</th>
                  <th className="px-2 py-3 text-left font-medium text-[var(--fg)]">退勤時刻</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((data, index) => {
                  const date = new Date(year, month - 1, data.day);
                  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  return (
                    <tr
                      key={data.day}
                      className={`border-b border-[var(--border)] hover:bg-[var(--bg)] ${
                        isWeekend ? 'bg-red-50 dark:bg-red-950/20' : ''
                      }`}
                    >
                      <td className="px-2 py-2 text-[var(--fg)]">{data.day}日</td>
                      <td className={`px-2 py-2 ${isWeekend ? 'text-red-600 dark:text-red-400' : 'text-[var(--fg)]'}`}>
                        {dayOfWeek}
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={data.is_holiday}
                          onChange={(e) => {
                            const newData = [...attendanceData];
                            newData[index].is_holiday = e.target.checked;
                            setAttendanceData(newData);
                          }}
                          className="rounded border-[var(--border)] text-brand focus:ring-2 focus:ring-brand"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="time"
                          value={data.start_time}
                          disabled={data.is_holiday}
                          onChange={(e) => {
                            const newData = [...attendanceData];
                            newData[index].start_time = e.target.value;
                            setAttendanceData(newData);
                          }}
                          className="rounded border border-[var(--border)] px-2 py-1 text-sm bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:ring-2 ring-brand disabled:opacity-50"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="time"
                          value={data.end_time}
                          disabled={data.is_holiday}
                          onChange={(e) => {
                            const newData = [...attendanceData];
                            newData[index].end_time = e.target.value;
                            setAttendanceData(newData);
                          }}
                          className="rounded border border-[var(--border)] px-2 py-1 text-sm bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:ring-2 ring-brand disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Generate Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end"
        >
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? '生成中...' : 'Excelファイルを生成'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
