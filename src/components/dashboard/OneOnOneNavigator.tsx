'use client';

import React from 'react';
import { CheckCircle, Users, MessageCircle, Calendar, ArrowRight, Clock } from 'lucide-react';
import { User } from '../../types';

const Avatar: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`relative flex shrink-0 overflow-hidden rounded-full ${className}`}>
    {children}
  </div>
);

const AvatarImage: React.FC<{ 
  src: string; 
  alt: string; 
  className?: string;
}> = ({ src, alt, className = '' }) => (
  <img 
    className={`aspect-square h-full w-full object-cover ${className}`} 
    src={src} 
    alt={alt}
    onError={(e) => {
      e.currentTarget.style.display = 'none';
    }}
  />
);

const AvatarFallback: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`flex h-full w-full items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-medium ${className}`}>
    {children}
  </div>
);

const Card: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  title?: string;
  subtitle?: string;
  onClick?: () => void;
}> = ({ children, className = '', title, subtitle, onClick }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''} ${className}`} onClick={onClick}>
    {(title || subtitle) && (
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        {title && <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>}
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
    )}
    <div className="px-6 py-4">
      {children}
    </div>
  </div>
);

interface OneOnOneNavigatorProps {
  suggestedPairs: Array<{ userId1: string; userId2: string }>;
  users: User[];
}

export const OneOnOneNavigator: React.FC<OneOnOneNavigatorProps> = ({ 
  suggestedPairs, 
  users 
}) => {
  const getUserById = (id: string) => users.find(user => user.id === id);

  if (suggestedPairs.length === 0) {
    return (
      <Card title="One-on-One Navigator" className="border-l-4 border-l-green-500">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-green-800 mb-1">Team Connections: Strong</h4>
            <p className="text-sm text-gray-600">
              Team communication is healthy. No immediate one-on-one meetings required.
            </p>
          </div>
          <div className="flex items-center gap-2 text-green-700">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">All Connected</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="One-on-One Navigator" subtitle={`${suggestedPairs.length} recommended meeting${suggestedPairs.length > 1 ? 's' : ''}`} className="border-l-4 border-l-blue-500">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">Connection Opportunities</h4>
              <p className="text-sm text-gray-600">
                These team members could benefit from structured one-on-one conversations.
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{suggestedPairs.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Suggested</div>
          </div>
        </div>
        
        <div className="space-y-3">
          {suggestedPairs.slice(0, 5).map((pair, index) => {
            const user1 = getUserById(pair.userId1);
            const user2 = getUserById(pair.userId2);
            
            if (!user1 || !user2) return null;
            
            return (
              <div key={`${pair.userId1}-${pair.userId2}`} className="group p-4 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* User 1 */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {user1.avatar ? (
                          <AvatarImage src={user1.avatar} alt={user1.name} />
                        ) : (
                          <AvatarFallback>{user1.name.charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                      <span className="font-medium text-gray-900">{user1.name}</span>
                    </div>
                    
                    {/* Connection Indicator */}
                    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-blue-200">
                      <MessageCircle className="w-3 h-3 text-blue-500" />
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <MessageCircle className="w-3 h-3 text-blue-500" />
                    </div>
                    
                    {/* User 2 */}
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{user2.name}</span>
                      <Avatar className="h-10 w-10">
                        {user2.avatar ? (
                          <AvatarImage src={user2.avatar} alt={user2.name} />
                        ) : (
                          <AvatarFallback>{user2.name.charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200 opacity-0 group-hover:opacity-100">
                    <Calendar className="w-4 h-4" />
                    Schedule Meeting
                  </button>
                </div>
                
                {/* Meeting Suggestion */}
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Suggested duration: 30 minutes</span>
                  <span className="text-gray-400">•</span>
                  <span>Priority: {index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low'}</span>
                </div>
              </div>
            );
          })}
        </div>
        
        {suggestedPairs.length > 5 && (
          <div className="text-center py-3 border-t border-gray-100">
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View {suggestedPairs.length - 5} more suggestions
            </button>
          </div>
        )}
        
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
              <CheckCircle className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="font-medium text-blue-900 mb-1">Best Practices for One-on-Ones</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Focus on relationship building and mutual understanding</li>
                <li>• Create a safe space for open and honest communication</li>
                <li>• Discuss both work-related topics and personal development</li>
                <li>• Schedule regular follow-ups to maintain connection</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};