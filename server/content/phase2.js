const phase1 = require('./phase1');

const commentSets = {
  newspaper: [
    { id: 'newspaper-c1', text: '민원이 많다는 건 알겠는데, 언제부터 언제까지 200건인지도 같이 보면 좋을 듯.', needsRevision: false },
    { id: 'newspaper-c2', text: '사진처럼 입구를 막고 있으면 진짜 불편하긴 하겠다. 주차구역을 따로 만들면 안 되나?', needsRevision: false },
    { id: 'newspaper-c3', text: '킥보드 타는 사람들은 다 생각이 없는 사람들임.', needsRevision: true },
    { id: 'newspaper-c4', text: '바로 전면 금지하기 전에 주차 단속이랑 안전교육 먼저 해보면 좋겠어요.', needsRevision: false },
    { id: 'newspaper-c5', text: '사진 한 장만 보면 심각해 보이는데 다른 장소도 다 그런지는 더 봐야 할 것 같아요.', needsRevision: false },
  ],
  broadcast: [
    { id: 'broadcast-c1', text: '영상으로 보니까 위험해 보이긴 함. 근데 사고 장면만 모은 건 아닌지도 궁금해요.', needsRevision: false },
    { id: 'broadcast-c2', text: '민원 200건이면 많은데, 한 달인지 1년인지에 따라 느낌이 좀 다를 듯.', needsRevision: false },
    { id: 'broadcast-c3', text: '저 회사는 망해야 정신 차림 ㅋㅋ', needsRevision: true },
    { id: 'broadcast-c4', text: '불편한 사람 인터뷰도 필요하지만 킥보드 쓰는 사람 의견도 같이 나오면 좋겠어요.', needsRevision: false },
    { id: 'broadcast-c5', text: '업체도 관리 책임은 있어 보임. 대신 무조건 없애기보다 규칙을 세게 하는 게 나을 것 같아요.', needsRevision: false },
  ],
  sns: [
    { id: 'sns-c1', text: '해시태그 많아서 엄청 빨리 퍼질 것 같긴 한데, 진짜인지 확인은 해야 할 듯.', needsRevision: false },
    { id: 'sns-c2', text: '사진만 보면 화날 수 있는데 어디서 언제 찍은 건지도 있으면 더 믿을 수 있을 것 같아요.', needsRevision: false },
    { id: 'sns-c3', text: '저런 거 타는 애들은 전부 민폐야.', needsRevision: true },
    { id: 'sns-c4', text: '신고 방법이나 안전하게 세우는 위치를 같이 알려주면 좀 도움 될 것 같아요.', needsRevision: false },
    { id: 'sns-c5', text: '화나는 건 이해되는데 다 욕하면 싸움만 날 것 같음. 해결 방법도 같이 말하면 좋겠어요.', needsRevision: false },
  ],
  youtube: [
    { id: 'youtube-c1', text: '썸네일은 엄청 세서 누르고 싶긴 한데, 제목만 보고 믿으면 안 될 것 같아요.', needsRevision: false },
    { id: 'youtube-c2', text: '조회수 높다고 무조건 맞는 건 아니니까 영상에서 근거를 보여주는지 봐야 함.', needsRevision: false },
    { id: 'youtube-c3', text: '조회수 벌려고 난리네. 이런 유튜버들 다 없어져야 함.', needsRevision: true },
    { id: 'youtube-c4', text: '직접 가봤다고 해도 다른 기사랑 비교해 보면 더 정확하게 알 수 있을 것 같아요.', needsRevision: false },
    { id: 'youtube-c5', text: '제목이 좀 자극적이면 내용이랑 진짜 맞는지 확인하고 댓글 달아야 할 듯.', needsRevision: false },
  ],
};

module.exports = phase1.map((card) => ({
  ...card,
  discussionComments: commentSets[card.id] || [],
}));
