import './AdvisorBubble.css'
import { ADVISORS } from '../constants/advisors.js'
import { useGameStore } from '../store/useGameStore.js'

const ADVISOR_LINES = {
  raider: {
    normal: 'Raider: 시장은 기다려주지 않습니다. 빠르게 압박하세요.',
    war: 'Raider: 전쟁 구간입니다. 짧고 강하게 점유율을 빼앗으세요.',
  },
  guardian: {
    normal: 'Guardian: 무너지지 않는 운영이 가장 강한 전략입니다.',
    war: 'Guardian: 손실을 막고 체력을 지키는 쪽이 오래 갑니다.',
  },
  analyst: {
    normal: 'Analyst: 정보가 곧 무기입니다. 라이벌의 빈틈을 보세요.',
    war: 'Analyst: 전쟁 구간입니다. 수치와 리스크를 함께 보세요.',
  },
  gambler: {
    normal: 'Gambler: 판이 흔들릴수록 기회도 커집니다.',
    war: 'Gambler: 큰 판입니다. 크레딧과 체력을 아껴 베팅하세요.',
  },
}

export function AdvisorBubble() {
  const advisor = useGameStore((state) => state.advisor)
  const activeEconomicWar = useGameStore((state) => state.activeEconomicWar)
  const info = ADVISORS[advisor]

  if (!info) {
    return null
  }

  const line =
    ADVISOR_LINES[advisor]?.[activeEconomicWar ? 'war' : 'normal'] ??
    'Advisor: 이번 달의 선택이 다음 흐름을 바꿀 수 있습니다.'

  return (
    <div className="cr2-advisor-bubble" style={{ '--cr2-advisor-color': info.themeColor }}>
      <span className="cr2-advisor-bubble__icon">{info.icon}</span>
      <div className="cr2-advisor-bubble__body">
        <strong>{info.name}</strong>
        <p>{line}</p>
      </div>
    </div>
  )
}
