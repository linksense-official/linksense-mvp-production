'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  Shield, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, Loader2,
  Mail, User, Building2, ArrowLeft, Globe, Check, X, Info,
  KeyRound, Smartphone, Users, Settings, Clock, Fingerprint,
  Star, Award, Zap, TrendingUp
} from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  company: string;
  jobTitle: string;
  teamSize: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  subscribeNewsletter: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
    noCommon: boolean;
  };
}

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    jobTitle: '',
    teamSize: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
    subscribeNewsletter: true
  });

  const [uiState, setUiState] = useState({
    loading: false,
    showPassword: false,
    showConfirmPassword: false,
    currentStep: 1,
    totalSteps: 3,
    emailVerificationSent: false,
    isValidatingEmail: false,
    showPasswordStrength: false
  });

  const [validation, setValidation] = useState<ValidationResult>({
    isValid: false,
    errors: [],
    warnings: []
  });

  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'とても弱い',
    color: 'bg-red-500',
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      numbers: false,
      symbols: false,
      noCommon: false
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { isAuthenticated, isLoading, registerUser } = useAuth();
  const router = useRouter();

  // 既にログイン済みの場合はダッシュボードにリダイレクト
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // 共通パスワードリスト（実際の実装では外部APIまたはより大きなリストを使用）
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890'
  ];

  // パスワード強度評価
  const evaluatePasswordStrength = useCallback((password: string): PasswordStrength => {
    const requirements = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      noCommon: !commonPasswords.includes(password.toLowerCase())
    };

    const score = Object.values(requirements).filter(Boolean).length;
    
    let label = 'とても弱い';
    let color = 'bg-red-500';
    
    if (score >= 6) {
      label = 'とても強い';
      color = 'bg-green-600';
    } else if (score >= 5) {
      label = '強い';
      color = 'bg-green-500';
    } else if (score >= 4) {
      label = '普通';
      color = 'bg-yellow-500';
    } else if (score >= 2) {
      label = '弱い';
      color = 'bg-orange-500';
    }

    return { score, label, color, requirements };
  }, []);

  // リアルタイムバリデーション
  const validateForm = useCallback((): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Step 1: 基本情報
    if (uiState.currentStep >= 1) {
      if (!formData.name.trim()) {
        errors.push('お名前を入力してください');
      } else if (formData.name.length < 2) {
        errors.push('お名前は2文字以上で入力してください');
      }

      if (!formData.email.trim()) {
        errors.push('メールアドレスを入力してください');
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          errors.push('有効なメールアドレスを入力してください');
        }
      }

      if (!formData.company.trim()) {
        warnings.push('会社名の入力をお勧めします');
      }
    }

    // Step 2: パスワード
    if (uiState.currentStep >= 2) {
      const strength = evaluatePasswordStrength(formData.password);
      
      if (!formData.password) {
        errors.push('パスワードを入力してください');
      } else {
        if (!strength.requirements.length) {
          errors.push('パスワードは12文字以上で入力してください');
        }
        if (!strength.requirements.uppercase) {
          errors.push('パスワードに大文字を含めてください');
        }
        if (!strength.requirements.lowercase) {
          errors.push('パスワードに小文字を含めてください');
        }
        if (!strength.requirements.numbers) {
          errors.push('パスワードに数字を含めてください');
        }
        if (!strength.requirements.symbols) {
          errors.push('パスワードに記号を含めてください');
        }
        if (!strength.requirements.noCommon) {
          errors.push('より安全なパスワードを選択してください');
        }
        
        if (strength.score < 4) {
          warnings.push('パスワード強度を向上させることをお勧めします');
        }
      }

      if (formData.password !== formData.confirmPassword) {
        errors.push('パスワードが一致しません');
      }
    }

    // Step 3: 利用規約
    if (uiState.currentStep >= 3) {
      if (!formData.agreeToTerms) {
        errors.push('利用規約への同意が必要です');
      }
      if (!formData.agreeToPrivacy) {
        errors.push('プライバシーポリシーへの同意が必要です');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [formData, uiState.currentStep, evaluatePasswordStrength]);

  // フォームデータ変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // パスワード強度リアルタイム評価
    if (name === 'password') {
      const strength = evaluatePasswordStrength(value);
      setPasswordStrength(strength);
      setUiState(prev => ({ ...prev, showPasswordStrength: value.length > 0 }));
    }

    // エラーリセット
    setError(null);
  };

  // リアルタイムバリデーション実行
  useEffect(() => {
    const result = validateForm();
    setValidation(result);
  }, [formData, validateForm]);

  // メール検証
  const validateEmailDomain = async (email: string): Promise<boolean> => {
    setUiState(prev => ({ ...prev, isValidatingEmail: true }));
    
    try {
      // 実際の実装では外部APIでドメイン検証を行う
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const disposableEmailDomains = [
        '10minutemail.com', 'tempmail.org', 'guerrillamail.com'
      ];
      
      const domain = email.split('@')[1];
      const isDisposable = disposableEmailDomains.includes(domain);
      
      if (isDisposable) {
        setError('一時的なメールアドレスは使用できません');
        return false;
      }
      
      return true;
    } finally {
      setUiState(prev => ({ ...prev, isValidatingEmail: false }));
    }
  };

  // ステップ進行
  const nextStep = async () => {
    const result = validateForm();
    
    if (!result.isValid) {
      setError(result.errors[0]);
      return;
    }

    if (uiState.currentStep === 1) {
      const isEmailValid = await validateEmailDomain(formData.email);
      if (!isEmailValid) return;
    }

    if (uiState.currentStep < uiState.totalSteps) {
      setUiState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
      setError(null);
    }
  };

  const prevStep = () => {
    if (uiState.currentStep > 1) {
      setUiState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
      setError(null);
    }
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = validateForm();
    if (!result.isValid) {
      setError(result.errors[0]);
      return;
    }

    setUiState(prev => ({ ...prev, loading: true }));
    setError(null);
    setSuccess(null);

    try {
      const registerResult = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        company: formData.company
      });

      // 登録成功後に追加情報を保存（実際の実装では別のAPI呼び出しまたはローカルストレージ）
      if (registerResult.success) {
        // 追加のユーザー情報をローカルストレージまたは別のAPIで保存
        const additionalUserData = {
          jobTitle: formData.jobTitle,
          teamSize: formData.teamSize,
          subscribeNewsletter: formData.subscribeNewsletter,
          registrationSource: 'web',
          passwordStrength: passwordStrength.score,
          agreementTimestamp: new Date().toISOString()
        };
        
        // ローカルストレージに一時保存（実際の実装では適切なAPI呼び出し）
        if (typeof window !== 'undefined') {
          localStorage.setItem('pendingUserData', JSON.stringify(additionalUserData));
        }
        
        setSuccess('アカウントが正常に作成されました。メール認証リンクを送信しました。');
        setUiState(prev => ({ ...prev, emailVerificationSent: true }));
        
        setTimeout(() => {
          router.push('/login?message=registration_success');
        }, 3000);
      } else {
        setError(registerResult.error || 'アカウント作成に失敗しました');
      }

    } catch (error) {
      setError('アカウント作成中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setUiState(prev => ({ ...prev, loading: false }));
    }
  };

  // ソーシャル登録（GitHubを削除）
  const handleSocialRegister = async (provider: 'google' | 'azure-ad') => {
    setUiState(prev => ({ ...prev, loading: true }));
    
    try {
      // 実際の実装ではNextAuthのsignInを使用
      window.location.href = `/api/auth/signin/${provider}?callbackUrl=/dashboard`;
    } catch (error) {
      setError(`${provider}での登録に失敗しました`);
      setUiState(prev => ({ ...prev, loading: false }));
    }
  };

  // 認証チェック中の表示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                ホームに戻る
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600">SOC2準拠</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-600">AES-256暗号化</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="flex justify-center items-center mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              LinkSense アカウント作成
            </h2>
            <p className="text-gray-600 mb-4">
              エンタープライズチーム健全性分析プラットフォーム
            </p>
            
            {/* プログレスバー */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>ステップ {uiState.currentStep} / {uiState.totalSteps}</span>
                <span>{Math.round((uiState.currentStep / uiState.totalSteps) * 100)}% 完了</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(uiState.currentStep / uiState.totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* 機能ハイライト */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <div className="bg-blue-100 p-2 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600">チーム分析</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 p-2 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-xs text-gray-600">セキュリティ</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 p-2 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-xs text-gray-600">AI分析</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
            {/* エラーメッセージ */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">登録エラー</h3>
                    <div className="mt-1 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 成功メッセージ */}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">登録成功</h3>
                    <div className="mt-1 text-sm text-green-700">{success}</div>
                  </div>
                </div>
              </div>
            )}

            {/* バリデーション警告 */}
            {validation.warnings.length > 0 && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <Info className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">推奨事項</h3>
                    <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                      {validation.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {!uiState.emailVerificationSent ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: 基本情報 */}
                {uiState.currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>
                      <p className="text-sm text-gray-600">アカウント作成に必要な基本情報を入力してください</p>
                    </div>

                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="h-4 w-4 inline mr-2" />
                        お名前 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="田中 太郎"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="h-4 w-4 inline mr-2" />
                        メールアドレス <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="tanaka@company.com"
                        />
                        {uiState.isValidatingEmail && (
                          <div className="absolute right-3 top-3">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                        <Building2 className="h-4 w-4 inline mr-2" />
                        会社名
                      </label>
                      <input
                        id="company"
                        name="company"
                        type="text"
                        value={formData.company}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="株式会社サンプル"
                      />
                    </div>

                    <div>
                      <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
                        <Settings className="h-4 w-4 inline mr-2" />
                        役職
                      </label>
                      <input
                        id="jobTitle"
                        name="jobTitle"
                        type="text"
                        value={formData.jobTitle}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="エンジニアリングマネージャー"
                      />
                    </div>

                    <div>
                      <label htmlFor="teamSize" className="block text-sm font-medium text-gray-700 mb-2">
                        <Users className="h-4 w-4 inline mr-2" />
                        チームサイズ
                      </label>
                      <select
                        id="teamSize"
                        name="teamSize"
                        value={formData.teamSize}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">選択してください</option>
                        <option value="1-5">1-5名</option>
                        <option value="6-20">6-20名</option>
                        <option value="21-50">21-50名</option>
                        <option value="51-100">51-100名</option>
                        <option value="101+">101名以上</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 2: パスワード設定 */}
                {uiState.currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">セキュリティ設定</h3>
                      <p className="text-sm text-gray-600">強力なパスワードでアカウントを保護してください</p>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        <Lock className="h-4 w-4 inline mr-2" />
                        パスワード <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          name="password"
                          type={uiState.showPassword ? "text" : "password"}
                          required
                          value={formData.password}
                          onChange={handleChange}
                          className="block w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="強力なパスワードを入力"
                        />
                        <button
                          type="button"
                          onClick={() => setUiState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {uiState.showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>

                      {/* パスワード強度インジケータ */}
                      {uiState.showPasswordStrength && (
                        <div className="mt-3 space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">パスワード強度</span>
                              <span className={`font-medium ${
                                passwordStrength.score >= 5 ? 'text-green-600' :
                                passwordStrength.score >= 4 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {passwordStrength.label}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className={`flex items-center ${passwordStrength.requirements.length ? 'text-green-600' : 'text-gray-400'}`}>
                              {passwordStrength.requirements.length ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                              12文字以上
                            </div>
                            <div className={`flex items-center ${passwordStrength.requirements.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                              {passwordStrength.requirements.uppercase ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                              大文字
                            </div>
                            <div className={`flex items-center ${passwordStrength.requirements.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                              {passwordStrength.requirements.lowercase ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                              小文字
                            </div>
                            <div className={`flex items-center ${passwordStrength.requirements.numbers ? 'text-green-600' : 'text-gray-400'}`}>
                              {passwordStrength.requirements.numbers ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                              数字
                              </div>
                            <div className={`flex items-center ${passwordStrength.requirements.symbols ? 'text-green-600' : 'text-gray-400'}`}>
                              {passwordStrength.requirements.symbols ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                              記号
                            </div>
                            <div className={`flex items-center ${passwordStrength.requirements.noCommon ? 'text-green-600' : 'text-gray-400'}`}>
                              {passwordStrength.requirements.noCommon ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                              安全性
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        <KeyRound className="h-4 w-4 inline mr-2" />
                        パスワード確認 <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={uiState.showConfirmPassword ? "text" : "password"}
                          required
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="block w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="パスワードを再入力"
                        />
                        <button
                          type="button"
                          onClick={() => setUiState(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {uiState.showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {formData.confirmPassword && (
                        <div className="mt-2 flex items-center text-sm">
                          {formData.password === formData.confirmPassword ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-green-600">パスワードが一致しています</span>
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 text-red-500 mr-2" />
                              <span className="text-red-600">パスワードが一致しません</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* セキュリティ情報 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex">
                        <Shield className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-blue-800">セキュリティ保護</h4>
                          <div className="mt-1 text-sm text-blue-700">
                            <ul className="list-disc list-inside space-y-1">
                              <li>AES-256暗号化でパスワードを保護</li>
                              <li>多要素認証でアカウントをさらに強化</li>
                              <li>不正アクセス監視システムが24/7稼働</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: 利用規約・完了 */}
                {uiState.currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">利用規約・完了</h3>
                      <p className="text-sm text-gray-600">最後に利用規約をご確認ください</p>
                    </div>

                    {/* 利用規約 */}
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <input
                          id="agreeToTerms"
                          name="agreeToTerms"
                          type="checkbox"
                          checked={formData.agreeToTerms}
                          onChange={handleChange}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="agreeToTerms" className="ml-3 text-sm text-gray-700">
                          <span className="text-red-500">*</span> 
                          <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-500 underline">
                            利用規約
                          </a>
                          に同意します
                        </label>
                      </div>

                      <div className="flex items-start">
                        <input
                          id="agreeToPrivacy"
                          name="agreeToPrivacy"
                          type="checkbox"
                          checked={formData.agreeToPrivacy}
                          onChange={handleChange}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="agreeToPrivacy" className="ml-3 text-sm text-gray-700">
                          <span className="text-red-500">*</span> 
                          <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-500 underline">
                            プライバシーポリシー
                          </a>
                          に同意します
                        </label>
                      </div>

                      <div className="flex items-start">
                        <input
                          id="subscribeNewsletter"
                          name="subscribeNewsletter"
                          type="checkbox"
                          checked={formData.subscribeNewsletter}
                          onChange={handleChange}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="subscribeNewsletter" className="ml-3 text-sm text-gray-700">
                          製品アップデートやセキュリティ情報のニュースレターを受信する
                        </label>
                      </div>
                    </div>

                    {/* コンプライアンス情報 */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">データ保護・コンプライアンス</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 text-green-600 mr-2" />
                          SOC2 Type II準拠
                        </div>
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 text-blue-600 mr-2" />
                          GDPR対応
                        </div>
                        <div className="flex items-center">
                          <Lock className="h-4 w-4 text-purple-600 mr-2" />
                          ISO27001認証
                        </div>
                        <div className="flex items-center">
                          <Fingerprint className="h-4 w-4 text-orange-600 mr-2" />
                          データ暗号化
                        </div>
                      </div>
                    </div>

                    {/* アカウント概要 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">アカウント概要</h4>
                      <div className="space-y-2 text-sm text-blue-700">
                        <div className="flex justify-between">
                          <span>お名前:</span>
                          <span className="font-medium">{formData.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>メールアドレス:</span>
                          <span className="font-medium">{formData.email}</span>
                        </div>
                        {formData.company && (
                          <div className="flex justify-between">
                            <span>会社名:</span>
                            <span className="font-medium">{formData.company}</span>
                          </div>
                        )}
                        {formData.teamSize && (
                          <div className="flex justify-between">
                            <span>チームサイズ:</span>
                            <span className="font-medium">{formData.teamSize}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ナビゲーションボタン */}
                <div className="flex justify-between pt-6">
                  {uiState.currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      戻る
                    </button>
                  ) : (
                    <div></div>
                  )}

                  {uiState.currentStep < uiState.totalSteps ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!validation.isValid || uiState.isValidatingEmail}
                      className={`flex items-center px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                        validation.isValid && !uiState.isValidatingEmail
                          ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {uiState.isValidatingEmail ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          検証中...
                        </>
                      ) : (
                        <>
                          次へ
                          <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!validation.isValid || uiState.loading}
                      className={`flex items-center px-6 py-3 text-sm font-medium text-white rounded-lg transition-colors ${
                        validation.isValid && !uiState.loading
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {uiState.loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          アカウント作成中...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          アカウント作成
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            ) : (
              /* メール認証待ち画面 */
              <div className="text-center space-y-6">
                <div className="bg-green-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                  <Mail className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">メール認証が必要です</h3>
                  <p className="text-gray-600 mb-4">
                    {formData.email} にメール認証リンクを送信しました。
                    メール内のリンクをクリックしてアカウントを有効化してください。
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">次のステップ:</h4>
                    <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                      <li>メールボックスを確認してください</li>
                      <li>LinkSenseからのメールを開いてください</li>
                      <li>「アカウントを有効化」ボタンをクリックしてください</li>
                      <li>ログインページでログインしてください</li>
                    </ol>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ログインページに移動
                </button>
              </div>
            )}

            {/* ソーシャル登録（GitHubを削除） */}
            {!uiState.emailVerificationSent && uiState.currentStep === 1 && (
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">または</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialRegister('google')}
                    disabled={uiState.loading}
                    className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google Workspaceで登録
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialRegister('azure-ad')}
                    disabled={uiState.loading}
                    className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#f25022" d="M1 1h10v10H1z"/>
                      <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                      <path fill="#7fba00" d="M1 13h10v10H1z"/>
                      <path fill="#ffb900" d="M13 13h10v10H13z"/>
                    </svg>
                    Microsoft 365で登録
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    エンタープライズSSO認証により、既存の組織アカウントで
                    <br />
                    安全にアカウントを作成できます
                  </p>
                </div>
              </div>
            )}

            {/* ログインリンク */}
            {!uiState.emailVerificationSent && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  既にアカウントをお持ちの方は{' '}
                  <button
                    onClick={() => router.push('/login')}
                    className="text-blue-600 hover:text-blue-500 font-medium underline"
                  >
                    ログイン
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* セキュリティ・信頼性表示 */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1 text-green-600" />
                <span>SOC2準拠</span>
              </div>
              <div className="flex items-center">
                <Lock className="h-4 w-4 mr-1 text-blue-600" />
                <span>AES-256暗号化</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-purple-600" />
                <span>24/7監視</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              エンタープライズグレードのセキュリティでお客様のデータを保護します
            </p>
          </div>

          {/* 機能プレビュー */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-6">
              LinkSenseで実現できること
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-white p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">AI駆動分析</h4>
                <p className="text-sm text-gray-600">チーム健全性をリアルタイム分析</p>
              </div>
              <div className="text-center">
                <div className="bg-white p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">チーム最適化</h4>
                <p className="text-sm text-gray-600">生産性とエンゲージメント向上</p>
              </div>
              <div className="text-center">
                <div className="bg-white p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-1">成果測定</h4>
                <p className="text-sm text-gray-600">データドリブンな意思決定支援</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;