import newspaperImage from '../assets/phase1/newspaper-kickboards.jpg';
import broadcastImage from '../assets/phase1/broadcast-kickboards.jpg';
import broadcastImage2 from '../assets/phase1/broadcast-kickboards1.jpg';
import snsImage from '../assets/phase1/sns-kickboards.jpg';
import youtubeImage from '../assets/phase1/youtube-thumbnail.png';
import snsOption01 from '../assets/phase1/sns-option-01.jpg';
import snsOption02 from '../assets/phase1/sns-option-02.jpg';
import snsOption03 from '../assets/phase1/sns-option-03.jpg';
import snsOption04 from '../assets/phase1/sns-option-04.jpg';
import snsOption05 from '../assets/phase1/sns-option-05.jpg';
import snsOption06 from '../assets/phase1/sns-option-06.jpg';
import snsOption07 from '../assets/phase1/sns-option-07.jpg';
import snsOption08 from '../assets/phase1/sns-option-08.jpg';
import snsOption09 from '../assets/phase1/sns-option-09.jpg';
import snsOption10 from '../assets/phase1/sns-option-10.jpg';
import snsOption11 from '../assets/phase1/sns-option-11.jpg';
import snsOption12 from '../assets/phase1/sns-option-12.jpg';

export const snsPhotoChoices = [
  { id: '', label: '사진 선택 안함', src: '' },
  { id: 'park-entrance', label: '공원 입구', src: newspaperImage },
  { id: 'sidewalk-news', label: '인도 현장', src: broadcastImage },
  { id: 'phone-shot', label: '가까이 찍은 사진', src: snsImage },
  { id: 'video-thumb', label: '영상 썸네일', src: youtubeImage },
  { id: 'wide-sidewalk', label: '넓은 길 사진', src: broadcastImage2 },
  { id: 'sns-option-01', label: '골목길 킥보드', src: snsOption01 },
  { id: 'sns-option-02', label: '공원 울타리 옆', src: snsOption02 },
  { id: 'sns-option-03', label: '횡단보도 근처', src: snsOption03 },
  { id: 'sns-option-04', label: '버스정류장 앞', src: snsOption04 },
  { id: 'sns-option-05', label: '아파트 보행로', src: snsOption05 },
  { id: 'sns-option-06', label: '상가 앞 인도', src: snsOption06 },
  { id: 'sns-option-07', label: '학교 앞 보도', src: snsOption07 },
  { id: 'sns-option-08', label: '공원 산책로', src: snsOption08 },
  { id: 'sns-option-09', label: '자전거 거치대 옆', src: snsOption09 },
  { id: 'sns-option-10', label: '좁은 골목 입구', src: snsOption10 },
  { id: 'sns-option-11', label: '상가 주차장 옆', src: snsOption11 },
  { id: 'sns-option-12', label: '보행로 모퉁이', src: snsOption12 },
];

export const snsPhotoMap = Object.fromEntries(snsPhotoChoices.filter((photo) => photo.id).map((photo) => [photo.id, photo.src]));
export const snsPhotoLabels = Object.fromEntries(snsPhotoChoices.filter((photo) => photo.id).map((photo) => [photo.id, photo.label]));
