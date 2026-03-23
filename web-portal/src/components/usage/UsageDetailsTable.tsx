import { useState } from 'react';
import { formatDate, formatDataGb, formatVoiceMinutes, formatSms } from '../../utils/usageFormatters';

type TabType = 'all' | 'data' | 'voice' | 'sms';

interface UsageRecord {
  date: string;
  type: 'DATA' | 'VOICE' | 'SMS';
  amount: number;
  runningTotal: number;
}

interface UsageDetailsTableProps {
  data: UsageRecord[];
  title?: string;
}

export function UsageDetailsTable({ data, title = 'Usage Details' }: UsageDetailsTableProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const tabs: { id: TabType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'data', label: 'Data' },
    { id: 'voice', label: 'Voice' },
    { id: 'sms', label: 'SMS' },
  ];

  const filteredData = activeTab === 'all' 
    ? data 
    : data.filter(item => item.type.toLowerCase() === activeTab);

  const formatAmount = (record: UsageRecord) => {
    switch (record.type) {
      case 'DATA':
        return `${formatDataGb(record.amount)} GB`;
      case 'VOICE':
        return formatVoiceMinutes(record.amount);
      case 'SMS':
        return formatSms(record.amount);
      default:
        return record.amount.toString();
    }
  };

  const formatTotal = (record: UsageRecord) => {
    switch (record.type) {
      case 'DATA':
        return `${formatDataGb(record.runningTotal)} GB`;
      case 'VOICE':
        return formatVoiceMinutes(record.runningTotal);
      case 'SMS':
        return formatSms(record.runningTotal);
      default:
        return record.runningTotal.toString();
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">Detailed usage breakdown</p>
          </div>
          <button
            className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            onClick={() => {}}
          >
            Export CSV ↓
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Running Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No {activeTab === 'all' ? '' : activeTab} usage data available.
                </td>
              </tr>
            ) : (
              filteredData.map((record, index) => (
                <tr key={`${record.date}-${record.type}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      record.type === 'DATA' ? 'bg-blue-100 text-blue-800' :
                      record.type === 'VOICE' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {record.type === 'DATA' ? '📊' : record.type === 'VOICE' ? '📞' : '💬'} {record.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatAmount(record)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatTotal(record)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
