import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/session';
import NewspaperCard from '../../components/media/NewspaperCard.jsx';
import BroadcastCard from '../../components/media/BroadcastCard.jsx';
import SNSCard from '../../components/media/SNSCard.jsx';
import YoutubeCard from '../../components/media/YoutubeCard.jsx';
import { socket } from '../../lib/socket';
import newspaperImage from '../../assets/phase1/newspaper-kickboards.jpg';
import broadcastImage from '../../assets/phase1/broadcast-kickboards.jpg';
import broadcastImage2 from '../../assets/phase1/broadcast-kickboards1.jpg';
import snsImage from '../../assets/phase1/sns-kickboards.jpg';
import youtubeImage from '../../assets/phase1/youtube-thumbnail.png';

const renderers = { newspaper: NewspaperCard, broadcast: BroadcastCard, sns: SNSCard, youtube: YoutubeCard };
const mediaLabels = {
  newspaper: '신문',
  broadcast: '방송',
  sns: 'SNS',
  youtube: '유튜브',
};
const methodOptions = ['제목', '글', '사진', '영상', '자막', '해시태그', '썸네일', '조회수', '좋아요'];
const featureOptions = [
  '사람들이 쉽게 반응하고 공유한다',
  '글과 사진으로 자세히 전달한다',
  '제목과 썸네일로 관심을 끈다',
  '영상과 자막으로 빠르게 전달한다',
];
const mediaImages = {
  newspaper: newspaperImage,
  broadcast: broadcastImage,
  sns: snsImage,
  youtube: youtubeImage,
};
const snsPhotoOptions = [
  { id: '', label: '사진 선택 안함', src: '' },
  { id: 'park-entrance', label: '공원 입구', src: newspaperImage },
  { id: 'sidewalk-news', label: '인도 현장', src: broadcastImage },
  { id: 'phone-shot', label: '가까이 찍은 사진', src: snsImage },
  { id: 'video-thumb', label: '영상 썸네일', src: youtubeImage },
  { id: 'wide-sidewalk', label: '넓은 길 사진', src: broadcastImage2 },
];
const sceneClasses = {
  newspaper: 'bg-[#e8e1d2] bg-[linear-gradient(90deg,rgba(120,113,108,0.12)_1px,transparent_1px),linear-gradient(rgba(120,113,108,0.08)_1px,transparent_1px)] bg-[length:34px_34px]',
  broadcast: 'bg-[#101827] bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.28),transparent_34%),linear-gradient(180deg,#0f172a,#111827)]',
  sns: 'bg-[#eef2f7] bg-[linear-gradient(180deg,#f8fafc,#e2e8f0)]',
  youtube: 'bg-[#080808]',
};

export default function Phase1() {
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [activityState, setActivityState] = useState({ step: 1, revealed: {} });
  const [answers, setAnswers] = useState({});
  const [form, setForm] = useState({ delivery_methods: {}, feature_matches: {}, most_accurate: '', most_emotional: '', free_text: '' });
  const [snsPost, setSnsPost] = useState({ photo_id: '', content: '' });
  const [hasSnsPosted, setHasSnsPosted] = useState(false);
  const [student, setStudent] = useState(null);
  const navigate = useNavigate();

  async function loadActivity1() {
    const data = await api('/api/student/activity1/state');
    setCards(data.cards);
    setActivityState(data.state);
    setAnswers(data.answers || {});
    if (data.answers?.[1]) setForm((prev) => ({ ...prev, delivery_methods: data.answers[1] }));
    if (data.answers?.[2]) setForm((prev) => ({ ...prev, feature_matches: data.answers[2] }));
    if (data.answers?.[3]) setForm((prev) => ({ ...prev, ...data.answers[3] }));
    const snsData = await api('/api/student/activity1/sns-posts');
    setHasSnsPosted(snsData.has_posted);
    if (snsData.my_post) setSnsPost({ photo_id: snsData.my_post.photo_id || '', content: snsData.my_post.content || '' });
  }

  useEffect(() => {
    api('/api/student/profile').then(({ student: profile, state }) => {
      setStudent(profile);
      if (!state.open_phases?.[1]) {
        navigate('/student');
        return;
      }
      loadActivity1();
    });
    socket.on('activity1_state_changed', (state) => {
      setActivityState(state);
      loadActivity1();
    });
    return () => socket.off('activity1_state_changed');
  }, [navigate]);

  async function submit(event) {
    event.preventDefault();
    const step = activityState.step;
    let payload = {};
    if (step === 1) {
      const allMethodsChecked = cards.every((item) => form.delivery_methods[item.id]?.length > 0);
      if (!allMethodsChecked) {
        alert('각 매체의 전달 방식을 하나 이상 골라주세요.');
        return;
      }
      payload = form.delivery_methods;
    }
    if (step === 2) {
      const allFeaturesMatched = cards.every((item) => form.feature_matches[item.id]);
      if (!allFeaturesMatched) {
        alert('각 매체의 특징을 모두 연결해주세요.');
        return;
      }
      payload = form.feature_matches;
    }
    if (step === 3) {
      if (!form.most_accurate || !form.most_emotional || !form.free_text.trim()) {
        alert('매체를 고르고 이유를 써주세요.');
        return;
      }
      payload = { most_accurate: form.most_accurate, most_emotional: form.most_emotional, free_text: form.free_text };
    }
    if (step === 4) return;
    await api('/api/student/activity1/answer', { method: 'POST', body: JSON.stringify({ question: step, payload }) });
    setAnswers({ ...answers, [step]: payload });
    alert('제출했습니다.');
  }

  async function goNext() {
    const data = await api('/api/student/activity1/state');
    if (data.state.step <= activityState.step) {
      alert('아직 선생님이 다음 문제를 열지 않았습니다.');
      return;
    }
    setActivityState(data.state);
    setAnswers(data.answers || {});
  }

  async function retractAnswer() {
    await api('/api/student/activity1/answer/3', { method: 'DELETE' });
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[3];
      return next;
    });
  }

  async function submitSnsPost() {
    if (!snsPost.content.trim()) {
      alert('게시글 내용을 입력해주세요.');
      return;
    }
    await api('/api/student/activity1/sns-post', { method: 'POST', body: JSON.stringify(snsPost) });
    setHasSnsPosted(true);
    alert('게시했습니다.');
  }

  function toggleMethod(mediaId, method) {
    const current = form.delivery_methods[mediaId] || [];
    const next = current.includes(method) ? current.filter((item) => item !== method) : [...current, method];
    setForm({ ...form, delivery_methods: { ...form.delivery_methods, [mediaId]: next } });
  }

  const card = cards[index];
  const Card = card ? renderers[card.type] : null;
  const displayCard = card ? { ...card, imageSrc: mediaImages[card.type] } : null;
  const ready = cards.length > 0;
  const step = activityState.step;
  const submitted = step === 4 ? hasSnsPosted : Boolean(answers[step]);
  const selectedSnsPhoto = snsPhotoOptions.find((option) => option.id === snsPost.photo_id) || snsPhotoOptions[0];

  return (
    <div className={`relative left-1/2 min-h-[calc(100vh-96px)] w-screen -translate-x-1/2 px-4 py-6 ${sceneClasses[card?.type] || 'bg-[#f7f7f2]'}`}>
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex items-center justify-between rounded-lg bg-white/90 p-3 shadow-sm backdrop-blur">
          <h2 className="text-2xl font-black">활동1</h2>
          <button className="rounded-md border border-stone-300 bg-white px-3 py-2" onClick={() => navigate('/student')}>활동 목록</button>
        </div>
        {Card && <Card card={displayCard} />}
        <div className="flex flex-wrap gap-2 rounded-lg bg-white/90 p-3 shadow-sm backdrop-blur">
          {cards.map((item, itemIndex) => <button key={item.id} className={`rounded-md px-3 py-2 ${index === itemIndex ? 'bg-stone-950 text-white' : 'border bg-white'}`} onClick={() => setIndex(itemIndex)}>{mediaLabels[item.type] || item.type}</button>)}
        </div>
        <form onSubmit={submit} className={`rounded-lg border bg-white p-4 shadow-sm ${ready ? 'border-stone-200' : 'border-stone-100 opacity-70'}`}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">문제 {step}</h3>
            {submitted && <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">제출 완료</span>}
          </div>
          {step === 1 && (
            <section>
              <h4 className="mb-3 font-bold">이 매체가 사용한 전달 방식은 무엇인가요?</h4>
              <div className="space-y-3">
                {cards.map((item) => (
                  <div key={item.id} className="grid gap-2 border-b border-stone-100 pb-3 last:border-0 last:pb-0 md:grid-cols-[90px_1fr]">
                    <div className="font-semibold">{mediaLabels[item.type] || item.type}</div>
                    <div className="flex flex-wrap gap-2">
                      {methodOptions.map((method) => (
                        <label key={method} className={`rounded-md border px-3 py-2 text-sm ${form.delivery_methods[item.id]?.includes(method) ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-300 bg-white'}`}>
                          <input className="sr-only" disabled={!ready || submitted} type="checkbox" checked={Boolean(form.delivery_methods[item.id]?.includes(method))} onChange={() => toggleMethod(item.id, method)} />
                          {method}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {step === 2 && (
            <section>
              <h4 className="mb-3 font-bold">각 매체의 특징을 알맞게 연결하세요.</h4>
              <div className="grid gap-3 md:grid-cols-2">
                {cards.map((item) => (
                  <label key={item.id} className="block">
                    <span className="mb-1 block text-sm font-semibold">{mediaLabels[item.type] || item.type}</span>
                    <select disabled={!ready || submitted} className="w-full rounded-md border p-3" value={form.feature_matches[item.id] || ''} onChange={(e) => setForm({ ...form, feature_matches: { ...form.feature_matches, [item.id]: e.target.value } })}>
                      <option value="">특징 선택</option>
                      {featureOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </section>
          )}
          {step === 3 && (
            <section>
              <h4 className="mb-3 font-bold">매체를 비교해 선택하고 이유를 쓰세요.</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <select disabled={!ready || submitted} className="rounded-md border p-3" value={form.most_accurate} onChange={(e) => setForm({ ...form, most_accurate: e.target.value })}>
                  <option value="">가장 정확해 보이는 매체</option>{cards.map((item) => <option key={item.id} value={item.id}>{mediaLabels[item.type] || item.type}</option>)}
                </select>
                <select disabled={!ready || submitted} className="rounded-md border p-3" value={form.most_emotional} onChange={(e) => setForm({ ...form, most_emotional: e.target.value })}>
                  <option value="">가장 마음을 흔드는 매체</option>{cards.map((item) => <option key={item.id} value={item.id}>{mediaLabels[item.type] || item.type}</option>)}
                </select>
              </div>
              <textarea disabled={!ready || submitted} className="mt-3 min-h-24 w-full rounded-md border p-3" placeholder="그렇게 생각한 까닭" value={form.free_text} onChange={(e) => setForm({ ...form, free_text: e.target.value })} />
            </section>
          )}
          {step === 4 && (
            <section className="grid gap-5 lg:grid-cols-[minmax(320px,440px)_1fr]">
              <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 text-sm font-black text-white">나</div>
                    <div>
                      <div className="text-sm font-black">{student?.name || '나'}</div>
                      <div className="text-xs text-stone-500">활동1 게시물 미리보기</div>
                    </div>
                  </div>
                  <div className="text-xl font-black text-stone-500">...</div>
                </div>
                {selectedSnsPhoto.src ? (
                  <img className="aspect-square w-full object-cover" src={selectedSnsPhoto.src} alt={selectedSnsPhoto.label} />
                ) : (
                  <div className="grid aspect-square w-full place-items-center bg-stone-100 px-8 text-center text-sm font-bold leading-6 text-stone-500">
                    사진 없이 글만 올리는 게시물입니다.
                  </div>
                )}
                <div className="space-y-3 p-4">
                  <div className="flex gap-3 text-2xl">
                    <span>♡</span>
                    <span>⌁</span>
                    <span>↗</span>
                  </div>
                  <p className="min-h-16 whitespace-pre-wrap text-sm leading-6 text-stone-900">
                    <span className="font-black">{student?.name || '나'} </span>
                    {snsPost.content.trim() || '여기에 내가 쓴 글이 게시물처럼 보입니다.'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="mb-3 text-xl font-black">SNS 게시물 만들기</h4>
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-6 lg:grid-cols-3">
                    {snsPhotoOptions.map((option) => (
                      <button
                        key={option.id || 'none'}
                        type="button"
                        className={`overflow-hidden rounded-lg border bg-white text-left ${snsPost.photo_id === option.id ? 'border-rose-500 ring-2 ring-rose-500' : 'border-stone-200'}`}
                        onClick={() => setSnsPost({ ...snsPost, photo_id: option.id })}
                      >
                        {option.src ? <img className="aspect-square w-full object-cover" src={option.src} alt={option.label} /> : <div className="grid aspect-square place-items-center bg-stone-100 px-2 text-center text-xs font-bold text-stone-500">사진 없음</div>}
                        <div className="truncate p-2 text-xs font-bold">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-black">게시글 내용</span>
                  <textarea className="min-h-32 w-full rounded-lg border border-stone-300 p-3 leading-6" maxLength={160} placeholder="사실과 생각을 구분해서 짧게 써보세요." value={snsPost.content} onChange={(event) => setSnsPost({ ...snsPost, content: event.target.value })} />
                  <span className="mt-1 block text-right text-xs font-bold text-stone-500">{snsPost.content.length}/160</span>
                </label>

                <aside className="rounded-lg border border-rose-100 bg-rose-50 p-4">
                  <h4 className="mb-3 font-black text-rose-950">올바른 SNS 글을 쓰는 방법</h4>
                  <ul className="space-y-2 text-sm leading-6 text-rose-950">
                    <li>확인한 사실과 내 생각을 구분해서 써요.</li>
                    <li>다른 사람을 비난하거나 놀리는 표현은 쓰지 않아요.</li>
                    <li>사진이 내용을 오해하게 만들지 않는지 확인해요.</li>
                    <li>공유하기 전에 한 번 더 읽고 책임 있게 게시해요.</li>
                  </ul>
                </aside>
              </div>
            </section>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {step < 4 && !submitted && <button disabled={!ready} className="rounded-md bg-stone-950 px-4 py-2 font-bold text-white disabled:bg-stone-300">제출</button>}
            {submitted && step < 3 && <button type="button" className="rounded-md border border-stone-300 px-4 py-2 font-bold" onClick={goNext}>다음 문제 풀기</button>}
            {submitted && step === 3 && <button type="button" className="rounded-md border border-stone-300 px-4 py-2 font-bold" onClick={retractAnswer}>회수하고 다시 작성</button>}
            {step === 4 && <button type="button" className="rounded-md bg-stone-950 px-4 py-2 font-bold text-white" onClick={submitSnsPost}>게시하기</button>}
            {step === 4 && <button type="button" disabled={!hasSnsPosted} className="rounded-md border border-stone-300 px-4 py-2 font-bold disabled:text-stone-300" onClick={() => navigate('/student/activity1-sns')}>우리반 SNS 보기</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
