import { useState } from 'react';
import { Settings, Sun, Moon, Monitor, User as UserIcon, Mail, Shield, Pencil, Save, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  // Password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.put('/api/users/me', { name: name.trim(), email: email.trim() });
      // Update local storage
      const savedUser = localStorage.getItem('auth_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.name = name.trim();
        parsed.email = email.trim();
        localStorage.setItem('auth_user', JSON.stringify(parsed));
      }
      toast({ title: '✅ Perfil atualizado!' });
      setEditing(false);
      // Reload to reflect changes
      window.location.reload();
    } catch (err: any) {
      toast({ title: '❌ Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold text-foreground">Configurações</h1>
      </div>

      {/* Perfil */}
      {user && (
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground">Perfil</h2>
            {!editing ? (
              <Button variant="ghost" size="sm" onClick={() => { setName(user.name); setEmail(user.email); setEditing(true); }}>
                <Pencil className="w-4 h-4 mr-1" /> Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                  Salvar
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground overflow-hidden shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>

            {editing ? (
              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <UserIcon className="w-3 h-3" /> Nome
                  </label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" maxLength={100} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" maxLength={255} />
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alterar Senha */}
      {user && (
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" /> Senha
            </h2>
            {!changingPassword && (
              <Button variant="ghost" size="sm" onClick={() => setChangingPassword(true)}>
                <Pencil className="w-4 h-4 mr-1" /> Alterar
              </Button>
            )}
          </div>

          {changingPassword ? (
            <div className="space-y-3 max-w-sm">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Senha atual</label>
                <div className="relative">
                  <Input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    maxLength={128}
                  />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nova senha</label>
                <div className="relative">
                  <Input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    maxLength={128}
                  />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowNewPw(!showNewPw)}>
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Confirmar nova senha</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  maxLength={128}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => { setChangingPassword(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
                  Cancelar
                </Button>
                <Button size="sm" disabled={savingPassword} onClick={async () => {
                  if (!currentPassword || !newPassword || !confirmPassword) {
                    toast({ title: 'Preencha todos os campos', variant: 'destructive' });
                    return;
                  }
                  if (newPassword.length < 6) {
                    toast({ title: 'A nova senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    toast({ title: 'As senhas não coincidem', variant: 'destructive' });
                    return;
                  }
                  setSavingPassword(true);
                  try {
                    await api.put('/api/users/me/password', { currentPassword, newPassword });
                    toast({ title: '✅ Senha alterada com sucesso!' });
                    setChangingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  } catch (err: any) {
                    toast({ title: '❌ Erro ao alterar senha', description: err.message, variant: 'destructive' });
                  } finally {
                    setSavingPassword(false);
                  }
                }}>
                  {savingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                  Salvar
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">••••••••</p>
          )}
        </div>
      )}

      {/* Aparência */}
      <div className="p-6 rounded-xl bg-card border border-border space-y-4">
        <h2 className="font-display font-semibold text-foreground">Aparência</h2>
        <p className="text-sm text-muted-foreground">Escolha o tema da interface.</p>
        <div className="flex gap-3">
          <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')} className="gap-2">
            <Sun className="w-4 h-4" /> Claro
          </Button>
          <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')} className="gap-2">
            <Moon className="w-4 h-4" /> Escuro
          </Button>
          <Button variant={theme === 'system' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('system')} className="gap-2">
            <Monitor className="w-4 h-4" /> Sistema
          </Button>
        </div>
      </div>
    </div>
  );
}