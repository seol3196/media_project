const phase1 = require('./phase1');

const commentSets = {
  newspaper: [
    { id: 'newspaper-c1', text: '기사에 나온 민원 건수의 출처가 어디인지 함께 확인하면 좋겠습니다.', needsRevision: false },
    { id: 'newspaper-c2', text: '공원 입구 사진을 보니 보행자가 불편했을 것 같아요.', needsRevision: false },
    { id: 'newspaper-c3', text: '킥보드 타는 사람들은 다 생각이 없는 사람들임.', needsRevision: true },
    { id: 'newspaper-c4', text: '전면 금지보다 주차구역을 먼저 늘리는 방법도 생각해 볼 수 있습니다.', needsRevision: false },
    { id: 'newspaper-c5', text: '사진 한 장만 보고 전체 상황을 판단하면 위험할 수 있습니다.', needsRevision: false },
  ],
  broadcast: [
    { id: 'broadcast-c1', text: '영상은 현장감이 있지만 자극적인 장면만 골랐는지도 봐야 합니다.', needsRevision: false },
    { id: 'broadcast-c2', text: '민원이 200건이라는 자막은 어떤 기간 기준인지 궁금합니다.', needsRevision: false },
    { id: 'broadcast-c3', text: '저 회사는 망해야 정신 차림 ㅋㅋ', needsRevision: true },
    { id: 'broadcast-c4', text: '시민 인터뷰가 여러 입장을 담았는지 확인해 보고 싶습니다.', needsRevision: false },
    { id: 'broadcast-c5', text: '불편을 겪는 사람과 이용하는 사람 의견을 같이 들어야 합니다.', needsRevision: false },
  ],
  sns: [
    { id: 'sns-c1', text: '해시태그가 많아서 빨리 퍼질 수 있지만 사실 확인도 필요합니다.', needsRevision: false },
    { id: 'sns-c2', text: '사진을 찍은 위치와 시간이 함께 있으면 더 믿을 수 있을 것 같아요.', needsRevision: false },
    { id: 'sns-c3', text: '저런 거 타는 애들은 전부 민폐야.', needsRevision: true },
    { id: 'sns-c4', text: '신고 방법을 공유하는 댓글은 문제 해결에 도움이 됩니다.', needsRevision: false },
    { id: 'sns-c5', text: '화난 표현보다 해결 방법을 같이 쓰면 더 좋은 글이 됩니다.', needsRevision: false },
  ],
  youtube: [
    { id: 'youtube-c1', text: '썸네일이 강해서 클릭하고 싶지만 영상 내용도 끝까지 봐야 합니다.', needsRevision: false },
    { id: 'youtube-c2', text: '조회수가 높다고 항상 정확한 정보라고 볼 수는 없습니다.', needsRevision: false },
    { id: 'youtube-c3', text: '조회수 벌려고 난리네. 이런 유튜버들 다 없어져야 함.', needsRevision: true },
    { id: 'youtube-c4', text: '직접 가봤다는 말만 믿지 말고 다른 기사와 비교해 보면 좋겠습니다.', needsRevision: false },
    { id: 'youtube-c5', text: '제목이 자극적인지, 근거가 충분한지 나눠서 봐야 합니다.', needsRevision: false },
  ],
};

module.exports = phase1.map((card) => ({
  ...card,
  discussionComments: commentSets[card.id] || [],
}));
