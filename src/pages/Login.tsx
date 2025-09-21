import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * ログイン画面。ユーザー名やパスワードに加えてアカウント種別を選択し、選択に応じた
 * 初期ページへリダイレクトします。ログイン状態とアカウント種別は localStorage に保存されます。
 */
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'candidate' | 'company'>('candidate');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // アカウント種別とログイン状態を保存
    localStorage.setItem('accountType', accountType);
    localStorage.setItem('loggedIn', 'true');
    // アカウント種別に応じて画面遷移
    if (accountType === 'company') {
      navigate('/company');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">ログイン</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="メールアドレスを入力"
          />
        </div>
        <div>
          <label className="block mb-1">パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="パスワードを入力"
          />
        </div>
        <div>
          <label className="block mb-1">アカウント種別</label>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as 'candidate' | 'company')}
            className="input"
          >
            <option value="candidate">求職者</option>
            <option value="company">企業</option>
          </select>
        </div>
        <button type="submit" className="btn-primary w-full">
          ログイン
        </button>
      </form>
    </div>
  );
}