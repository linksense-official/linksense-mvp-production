'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

interface EditableMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
  skills: string[];
  phone: string;
  location: string;
  bio: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  preferences: {
    workingHours: {
      start: string;
      end: string;
    };
    communicationStyle: string;
    preferredMeetingTimes: string[];
  };
}

const MemberEditPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [member, setMember] = useState<EditableMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    const fetchMemberData = async () => {
      setIsLoading(true);
      
      // モックデータ
      const mockMember: EditableMember = {
        id: params.id as string,
        name: '田中太郎',
        email: 'tanaka@company.com',
        role: 'シニアエンジニア',
        department: '開発部',
        avatar: '/api/placeholder/100/100',
        skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker'],
        phone: '090-1234-5678',
        location: '東京都渋谷区',
        bio: '10年以上のソフトウェア開発経験を持つシニアエンジニア。フロントエンドからバックエンドまで幅広い技術に精通しており、チームのテクニカルリーダーとして活躍中。',
        emergencyContact: {
          name: '田中花子',
          relationship: '配偶者',
          phone: '090-8765-4321'
        },
        preferences: {
          workingHours: {
            start: '09:00',
            end: '18:00'
          },
          communicationStyle: 'チャット優先',
          preferredMeetingTimes: ['10:00-12:00', '14:00-16:00']
        }
      };

      setTimeout(() => {
        setMember(mockMember);
        setIsLoading(false);
      }, 500);
    };

    if (params.id) {
      fetchMemberData();
    }
    return undefined;
  }, [params.id]);

  const handleInputChange = (field: string, value: string) => {
    if (member) {
      setMember({ ...member, [field]: value });
    }
  };

  const handleNestedInputChange = (parentField: string, field: string, value: string | Record<string, string>) => {
  if (member) {
    setMember({
      ...member,
      [parentField]: {
        ...(member as any)[parentField],
        [field]: value
      }
    });
  }
};
  const handleAddSkill = () => {
    if (newSkill.trim() && member && !member.skills.includes(newSkill.trim())) {
      setMember({
        ...member,
        skills: [...member.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (member) {
      setMember({
        ...member,
        skills: member.skills.filter(skill => skill !== skillToRemove)
      });
    }
  };

  const handleSave = async () => {
    if (!member) return;
    
    setIsSaving(true);
    
    // モック保存処理
    setTimeout(() => {
      setIsSaving(false);
      router.push(`/members/${member.id}`);
    }, 1000);
  };

  const handleCancel = () => {
    router.push(`/members/${params.id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">メンバーが見つかりません</h2>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleCancel}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              メンバー詳細に戻る
            </button>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">メンバー情報編集</h1>
          <p className="text-gray-600 mt-1">{member.name}さんの情報を編集</p>
        </div>

        <div className="space-y-8">
          {/* 基本情報 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">基本情報</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={member.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  役職 <span className="text-red-500">*</span>
                </label>
                <select
                  value={member.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ジュニアエンジニア">ジュニアエンジニア</option>
                  <option value="エンジニア">エンジニア</option>
                  <option value="シニアエンジニア">シニアエンジニア</option>
                  <option value="テックリード">テックリード</option>
                  <option value="エンジニアリングマネージャー">エンジニアリングマネージャー</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  部署 <span className="text-red-500">*</span>
                </label>
                <select
                  value={member.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="開発部">開発部</option>
                  <option value="デザイン部">デザイン部</option>
                  <option value="マーケティング部">マーケティング部</option>
                  <option value="営業部">営業部</option>
                  <option value="人事部">人事部</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={member.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  勤務地
                </label>
                <input
                  type="text"
                  value={member.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                自己紹介
              </label>
              <textarea
                value={member.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="自己紹介を入力してください..."
              />
            </div>
          </div>

          {/* スキル */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">スキル</h2>
            
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="新しいスキルを追加"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                />
                <button
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  追加
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {member.skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 緊急連絡先 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">緊急連絡先</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  名前
                </label>
                <input
                  type="text"
                  value={member.emergencyContact.name}
                  onChange={(e) => handleNestedInputChange('emergencyContact', 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  続柄
                </label>
                <select
                  value={member.emergencyContact.relationship}
                  onChange={(e) => handleNestedInputChange('emergencyContact', 'relationship', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="配偶者">配偶者</option>
                  <option value="親">親</option>
                  <option value="兄弟">兄弟</option>
                  <option value="友人">友人</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={member.emergencyContact.phone}
                  onChange={(e) => handleNestedInputChange('emergencyContact', 'phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 勤務設定 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">勤務設定</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  勤務開始時間
                </label>
                <input
                  type="time"
                  value={member.preferences.workingHours.start}
                  onChange={(e) => handleNestedInputChange('preferences', 'workingHours', {
                    ...member.preferences.workingHours,
                    start: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  勤務終了時間
                </label>
                <input
                  type="time"
                  value={member.preferences.workingHours.end}
                  onChange={(e) => handleNestedInputChange('preferences', 'workingHours', {
                    ...member.preferences.workingHours,
                    end: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  コミュニケーションスタイル
                </label>
                <select
                  value={member.preferences.communicationStyle}
                  onChange={(e) => handleNestedInputChange('preferences', 'communicationStyle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="チャット優先">チャット優先</option>
                  <option value="メール優先">メール優先</option>
                  <option value="電話優先">電話優先</option>
                  <option value="対面優先">対面優先</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 保存ボタン（フッター） */}
        <div className="mt-8 flex justify-end space-x-3 bg-white rounded-lg shadow-sm p-4">
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '保存中...' : '変更を保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberEditPage;