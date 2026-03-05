import { useState } from 'react';
import { useAuth, UserAddress } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import dsgLogo from '@/assets/dsg-logo-dragon.webp';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 1 = dados pessoais, 2 = endereço

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [address, setAddress] = useState<UserAddress>({
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    complement: '',
  });

  const [loading, setLoading] = useState(false);

  const formatCpf = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatCep = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 8);
    return digits.replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast({ title: '✅ Sucesso!', description: 'Login realizado!' });
      navigate('/home');
    } catch (err: any) {
      toast({ title: '❌ Erro', description: err.message || 'Falha na autenticação', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: 'Senha fraca', description: 'A senha deve ter no mínimo 8 caracteres.', variant: 'destructive' });
      return;
    }
    setStep(2);
  };

  const handleRegisterStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        cpf: cpf.replace(/\D/g, ''),
        address: {
          ...address,
          zipCode: address.zipCode.replace(/\D/g, ''),
        },
      });
      toast({ title: '✅ Sucesso!', description: 'Conta criada!' });
      navigate('/home');
    } catch (err: any) {
      toast({ title: '❌ Erro', description: err.message || 'Falha no cadastro', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setStep(1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <img src={dsgLogo} alt="DSG Tech" className="w-16 h-16 rounded-full mx-auto mb-4 gold-border-glow" />
          <h1 className="text-2xl font-display font-bold text-foreground gold-glow">DSG Tech</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? 'Entre na sua conta' : step === 1 ? 'Dados pessoais' : 'Endereço de entrega'}
          </p>
        </div>

        {/* LOGIN */}
        {isLogin && (
          <form onSubmit={handleLogin} className="space-y-4 p-6 bg-card rounded-xl border border-border">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Entrar
            </Button>
          </form>
        )}

        {/* REGISTER STEP 1 */}
        {!isLogin && step === 1 && (
          <form onSubmit={handleRegisterStep1} className="space-y-4 p-6 bg-card rounded-xl border border-border">
            <div className="space-y-2">
              <Label>Nome completo</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required />
            </div>
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
            </div>
            <div className="space-y-2">
              <Label>Senha (mín. 8 caracteres)</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
            </div>
            <Button type="submit" className="w-full gap-2">
              Próximo <ChevronRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        {/* REGISTER STEP 2 - ADDRESS */}
        {!isLogin && step === 2 && (
          <form onSubmit={handleRegisterStep2} className="space-y-4 p-6 bg-card rounded-xl border border-border">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>CEP</Label>
                <Input value={address.zipCode} onChange={e => setAddress({ ...address, zipCode: formatCep(e.target.value) })} placeholder="00000-000" required />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Rua</Label>
                <Input value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} placeholder="Rua / Avenida" required />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input value={address.number} onChange={e => setAddress({ ...address, number: e.target.value })} placeholder="123" required />
              </div>
              <div className="space-y-2">
                <Label>Complemento</Label>
                <Input value={address.complement || ''} onChange={e => setAddress({ ...address, complement: e.target.value })} placeholder="Apto, bloco..." />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Bairro</Label>
                <Input value={address.neighborhood} onChange={e => setAddress({ ...address, neighborhood: e.target.value })} placeholder="Bairro" required />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} placeholder="Cidade" required />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} placeholder="UF" maxLength={2} required />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ChevronLeft className="w-4 h-4" /> Voltar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Criar Conta
              </Button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button onClick={switchMode} className="text-primary font-medium hover:underline">
            {isLogin ? 'Criar conta' : 'Fazer login'}
          </button>
        </p>
      </div>
    </div>
  );
}
