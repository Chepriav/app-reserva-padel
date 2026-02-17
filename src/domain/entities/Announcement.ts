export type AnnouncementType = 'info' | 'warning' | 'urgent' | 'maintenance';
export type AnnouncementRecipients = 'all' | 'selected';

export interface Announcement {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  message: string;
  type: AnnouncementType;
  recipients: AnnouncementRecipients;
  expiresAt: string;
  createdAt: string;
  isRead: boolean; // derived from anuncios_destinatarios for the requesting user
}

export interface CreateAnnouncementData {
  creatorId: string;
  creatorName: string;
  title: string;
  message: string;
  type?: AnnouncementType;
  recipients?: AnnouncementRecipients;
  userIds?: string[]; // for 'selected' recipients
}
