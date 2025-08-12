import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  aadhar_number: string | null;
  pan_number: string | null;
}

const UserProfile: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhar, setAadhar] = useState('');
  const [pan, setPan] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      loadProfile();
    }
  }, [user, loading]);

  const loadProfile = async () => {
    try {
      const r = await apiClient.get<Profile>('/api/users/me');
      const p = (r as any).data || r;
      setProfile(p);
      setFirstName(p.first_name || '');
      setLastName(p.last_name || '');
      setPhone(p.phone || '');
      setAadhar(p.aadhar_number || '');
      setPan(p.pan_number || '');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load profile');
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiClient.put('/api/users/me', {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        aadhar_number: aadhar,
        pan_number: pan,
      });
      toast.success('Profile saved');
      await loadProfile();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    setIsChanging(true);
    try {
      await apiClient.post('/api/users/me/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to change password');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button variant="outline" onClick={() => navigate('/user-dashboard')}>Back to Dashboard</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Update your name, phone, Aadhar and PAN. Email is fixed.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={profile?.email || ''} disabled />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>First name</Label>
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div>
                  <Label>Last name</Label>
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <Label>Aadhar Number</Label>
                <Input placeholder="XXXX-XXXX-XXXX" value={aadhar} onChange={e => setAadhar(e.target.value)} />
              </div>
              <div>
                <Label>PAN Number</Label>
                <Input placeholder="ABCDE1234F" value={pan} onChange={e => setPan(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Set a new password for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              </div>
              <div>
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isChanging}>{isChanging ? 'Updating...' : 'Change Password'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Donation PAN (Optional)</CardTitle>
          <CardDescription>
            If you donate on behalf of someone else, you may enter their PAN for tax receipts during checkout. This is optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">You can enter the alternate PAN on the donation popup when you click “Donate Now”.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;


