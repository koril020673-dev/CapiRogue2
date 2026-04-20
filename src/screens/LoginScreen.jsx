import { useState } from 'react'
import './LoginScreen.css'
import { useGameStore } from '../store/useGameStore.js'

export function LoginScreen() {
  const login = useGameStore((state) => state.login)
  const loginError = useGameStore((state) => state.loginError)
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    login({ userId, password })
  }

  return (
    <main className="cr2-login-screen">
      <div className="cr2-login-screen__backdrop" />

      <section className="cr2-login-screen__panel">
        <div className="cr2-login-screen__hero">
          <p className="cr2-login-screen__eyebrow">Session Login</p>
          <h1>CapiRogue 2</h1>
          <p className="cr2-login-screen__copy">
            로그인 상태로 런을 이어가고, 관리자 계정이면 층 이동과 전체 어드바이저 해금 같은 테스트 기능도 사용할 수 있습니다.
          </p>
        </div>

        <form className="cr2-login-screen__form" onSubmit={handleSubmit}>
          <label className="cr2-login-screen__field">
            <span>ID</span>
            <input
              type="text"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="아이디를 입력하세요"
              autoComplete="username"
            />
          </label>

          <label className="cr2-login-screen__field">
            <span>PW</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
            />
          </label>

          {loginError ? <p className="cr2-login-screen__error">{loginError}</p> : null}

          <button type="submit" className="cr2-login-screen__submit">
            로그인하고 시작하기
          </button>
        </form>

        <div className="cr2-login-screen__hint">
          <span>관리자 테스트 계정</span>
          <strong>ID 1234 / PW 1234</strong>
        </div>
      </section>
    </main>
  )
}
