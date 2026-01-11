import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';

const PaymentMethodAccordion = ({ channels, selectedMethod, onSelectMethod, onFeeChange }) => {
    const [openGroup, setOpenGroup] = useState('');

    // Group channels by group
    const groupedChannels = channels.reduce((acc, channel) => {
        const group = channel.group || 'Lainnya';
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(channel);
        return acc;
    }, {});

    const handleSelect = (channelCode, fee) => {
        onSelectMethod(channelCode);
        if (onFeeChange) {
            onFeeChange(fee);
        }
    };

    return (
        <div className="space-y-3">
            {Object.entries(groupedChannels).map(([groupName, groupChannels]) => (
                <div key={groupName} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setOpenGroup(openGroup === groupName ? '' : groupName)}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                    >
                        <span className="font-semibold text-gray-900">{groupName}</span>
                        <span className="text-gray-500">
                            {openGroup === groupName ? '▼' : '▶'}
                        </span>
                    </button>

                    {openGroup === groupName && (
                        <div className="p-2 space-y-2">
                            {groupChannels.map((channel) => (
                                <div
                                    key={channel.code}
                                    onClick={() => handleSelect(channel.code, channel.total_fee?.flat || 0)}
                                    className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${selectedMethod === channel.code
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-100 hover:border-green-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {channel.icon_url && (
                                                <img src={channel.icon_url} alt={channel.name} className="w-12 h-12 object-contain" />
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900">{channel.name}</p>
                                                {channel.total_fee?.flat > 0 && (
                                                    <p className="text-xs text-gray-500">
                                                        Biaya: {formatCurrency(channel.total_fee.flat)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {selectedMethod === channel.code && (
                                            <span className="text-green-600 font-bold">✓</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default PaymentMethodAccordion;
