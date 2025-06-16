export interface UnifiedUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  service: string;
  role?: string;
  department?: string;
  lastActivity?: string;
  isActive: boolean;
  activityScore: number;
  communicationScore: number;
  isolationRisk: 'low' | 'medium' | 'high';
  relationshipType: 'teammate' | 'friend' | 'contact' | 'frequent_contact' | 'self';
  relationshipStrength: number;
  metadata: {
    messageCount?: number;
    meetingCount?: number;
    responseTime?: number;
    workingHours?: string;
    timezone?: string;
    joinDate?: string;
    processingMode?: string;
    processingTime?: number;
    note?: string;
    error?: string;
    // サービス固有のプロパティ
    isRestricted?: boolean;
    isUltraRestricted?: boolean;
    hasFiles?: boolean;
    userType?: string;
    lastSignInDateTime?: string;
    domain?: string;
    discordId?: string;
    discriminator?: string;
    title?: string;
    organization?: string;
    chatwork_id?: string;
    contactType?: 'direct' | 'group' | 'organization';
    roomParticipation?: number;
    interactionScore?: number;
    lastInteraction?: string;
    // Slack固有
    messagesLast30Days?: number;
    messagesLast7Days?: number;
    activeChannelsCount?: number;
    channelDiversity?: number;
    reactionsGiven?: number;
    reactionsReceived?: number;
    avgResponseTimeMinutes?: number;
    dmFrequency?: number;
    lastDMTime?: string;
    totalChannelsJoined?: number;
    publicChannelsRatio?: number;
    activityLevel?: 'high' | 'medium' | 'low';
    engagementLevel?: 'high' | 'medium' | 'low';
    responsivenessLevel?: 'high' | 'medium' | 'low';
    // Teams固有
    meetingsAttended?: number;
    meetingsOrganized?: number;
    totalMeetingHours?: number;
    attendanceRate?: number;
    recurringMeetings?: number;
    acceptanceRate?: number;
    lastMeetingTime?: string;
    chatsParticipated?: number;
    chatInitiationRate?: number;
    lastChatTime?: string;
    filesCollaborated?: number;
    filesCreated?: number;
    filesEdited?: number;
    commentsLeft?: number;
    lastFileActivity?: string;
    totalInteractions?: number;
    collaborationLevel?: 'high' | 'medium' | 'low';
    meetingEngagement?: 'high' | 'medium' | 'low';
    workStyle?: string;
    // Google固有
    emailsSent?: number;
    emailsReceived?: number;
    responseRate?: number;
    communicationFrequency?: number;
    emailThreads?: number;
    emailTypes?: string[];
    sharedFolders?: number;
    fileTypes?: string[];
    collaborationScore?: number;
    calendarScore?: number;
    gmailScore?: number;
    driveScore?: number;
    accountHealthScore?: number;
    profileScore?: number;
    // Discord固有
    guildsCount?: number;
    connectionsCount?: number;
    availableScopes?: string;
    guildId?: string;
    guildName?: string;
    isOwner?: boolean;
    permissions?: string;
    memberCount?: number;
    joinedAt?: string;
    daysSinceJoin?: number;
    hasSpecialRoles?: boolean;
    nickname?: string;
    recentMessages?: number;
    activeUsers?: number;
    activeChannels?: number;
    totalChannels?: number;
    lastMessageTime?: string;
    hoursSinceLastMessage?: number;
    participationLevel?: string;
    serverSize?: string;
    messageActivity?: string;
    userDiversity?: string;
    channelUtilization?: string;
    premiumTier?: number;
    features?: string[];
    verificationLevel?: number;
    // フォールバック・エラー関連
    fallbackMode?: boolean;
    emergencyMode?: boolean;
    limitedPermissions?: boolean;
    authenticationFailed?: boolean;
    needsPermissions?: string;
    tokenLength?: number;
    // 追加可能な任意のプロパティ
    [key: string]: any;
  };
}

export interface TeamHealthMetrics {
  totalMembers: number;
  activeMembers: number;
  healthScore: number;
  isolationRisks: {
    high: number;
    medium: number;
    low: number;
  };
  serviceDistribution: Record<string, number>;
  relationshipDistribution: Record<string, number>;
  lastUpdated: string;
}

export interface RiskAnalysis {
  summary: {
    total: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    isolated: number;
    weakRelationships: number;
  };
  relationshipRiskAnalysis: Record<string, { high: number; medium: number; low: number; total: number }>;
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    targets: string[];
    reason: string;
    details: string;
    timeline: string;
  }>;
  trends: {
    improving: number;
    declining: number;
    stable: number;
  };
  criticalInsights: Array<{
    type: 'warning' | 'info' | 'success';
    title: string;
    message: string;
    impact: 'high' | 'medium' | 'low' | 'positive';
    actionRequired: boolean;
  }>;
}