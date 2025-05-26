import React, { useState } from 'react';
import type { PaymentMethod as PaymentMethodType } from '../../../types';

interface PaymentMethodProps {
  paymentMethods: PaymentMethodType[];
  onAddPaymentMethod: (paymentData: any) => Promise<void>;
  isLoading: boolean;
}

const PaymentMethodComponent: React.FC<PaymentMethodProps> = ({
  paymentMethods,
  onAddPaymentMethod,
  isLoading
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">支払い方法</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          支払い方法を追加
        </button>
      </div>

      {paymentMethods.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">支払い方法が登録されていません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div key={method.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{method.type}</p>
                  <p className="text-sm text-gray-600">{method.last4}</p>
                </div>
                {method.isDefault && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    デフォルト
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentMethodComponent;