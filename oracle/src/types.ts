export type Authority = 'Canon' | 'Draft' | 'Reference' | 'Historical' | 'Inspiration';
export type Scope = 'Global' | 'Series' | 'Campaign' | 'Private';

export type OracleDocument = {
  id: string;
  title: string;
  authority: Authority;
  scope: Scope;
  status: string;
  current_version: number;
  created_at: string;
};

export type ApprovalItem = {
  id: string;
  item_type: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  proposed_change: Record<string, unknown>;
  created_at: string;
};
