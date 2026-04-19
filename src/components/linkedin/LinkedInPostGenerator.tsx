import React, { useState } from 'react';
import { Wand2, ExternalLink, Copy, Trash2, Hash, Eye, TrendingUp, Zap, Image, Download, Lightbulb } from 'lucide-react';
import { useStore } from '@/lib/store';
import { generateLinkedInPost } from '@/lib/ai';
import { buildLinkedInPostURL, isPostTooLongForURL, INDUSTRIES } from '@/lib/utils';
import { generatePostImage, downloadImage, IMAGE_STYLE_OPTIONS, IMAGE_FAMILIES, type ImageStyle } from '@/lib/postImage';
import { TOPIC_SUGGESTIONS, TOPIC_CATEGORIES } from '@/lib/postTopics';
import type { LinkedInPost } from '@/lib/types';
import toast from 'react-hot-toast';

const POST_TYPES = [
  { value: 'thought-leadership', label: '💡 Thought Leadership', description: 'Share expertise & opinions' },
  { value: 'case-study', label: '📊 Case Study', description: 'Show results & proof' },
  { value: 'tips', label: '✅ Tips & Tricks', description: 'Actionable advice list' },
  { value: 'story', label: '📖 Story', description: 'Personal journey narrative' },
  { value: 'poll', label: '🗳️ Poll / Question', description: 'Drive engagement fast' },
  { value: 'engagement', label: '🔥 Engagement Bait', description: 'Debate-worthy hot take' },
];

export default function LinkedInPostGenerator() {
  const { posts, addPost, deletePost, userProfile } = useStore();
  const [form, setForm] = useState({
    topic: '',
    postType: 'thought-leadership' as LinkedInPost['postType'],
    industry: 'Technology',
    targetAudience: userProfile.targetAudience,
  });
  const [generated, setGenerated] = useState<{ content: string; hashtags: string[]; hook: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [imageStyle, setImageStyle] = useState<ImageStyle>('hook-indigo');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [topicCategory, setTopicCategory] = useState<string>('trending');
  const [topicSearch, setTopicSearch] = useState('');
  const [imageFamily, setImageFamily] = useState<string>('all');

  const handleGenerate = async () => {
    if (!form.topic) { toast.error('Enter a topic first'); return; }
    setLoading(true);
    try {
      const result = await generateLinkedInPost({
        topic: form.topic,
        postType: form.postType,
        industry: form.industry,
        targetAudience: form.targetAudience,
        yourSkills: userProfile.skills,
      });
      setGenerated(result);
      setEditContent(result.content + '\n\n' + result.hashtags.map((h) => `#${h.replace('#', '')}`).join(' '));
      toast.success('Post generated!');
    } catch {
      toast.error('Failed. Check your API key.');
    }
    setLoading(false);
  };

  const finalContent = editing ? editContent : (generated ? `${generated.content}\n\n${generated.hashtags.map((h) => `#${h.replace('#', '')}`).join(' ')}` : '');

  const handlePostToLinkedIn = () => {
    if (!finalContent) return;
    if (isPostTooLongForURL(finalContent)) {
      navigator.clipboard.writeText(finalContent);
      toast.success('Post copied to clipboard — paste it in LinkedIn!', { duration: 5000 });
    }
    const url = buildLinkedInPostURL(finalContent);
    window.open(url, '_blank');
  };

  const handleSave = () => {
    if (!generated) return;
    const post: LinkedInPost = {
      id: Date.now().toString(),
      content: finalContent,
      hook: generated.hook,
      hashtags: generated.hashtags,
      postType: form.postType,
      estimatedReach: Math.floor(Math.random() * 5000) + 2000,
      bestTimeToPost: '9:00 AM - 11:00 AM',
      createdAt: new Date().toISOString(),
    };
    addPost(post);
    toast.success('Post saved!');
  };

  return (
    <div className="space-y-6">
      {/* Generator */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} color="#a5b4fc" />
          <h3 className="font-semibold text-sm" style={{ color: '#a5b4fc', fontFamily: 'Syne' }}>
            AI LinkedIn Post Generator
          </h3>
        </div>

        {/* Post type */}
        <div className="mb-4">
          <label className="text-xs font-medium block mb-2" style={{ color: '#64748b', fontFamily: 'Syne' }}>Post Type</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {POST_TYPES.map((pt) => (
              <button
                key={pt.value}
                onClick={() => setForm({ ...form, postType: pt.value as LinkedInPost['postType'] })}
                className="p-3 rounded-xl text-left transition-all"
                style={{
                  background: form.postType === pt.value ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${form.postType === pt.value ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                <div className="text-xs font-medium mb-0.5" style={{ color: form.postType === pt.value ? '#a5b4fc' : '#64748b' }}>
                  {pt.label}
                </div>
                <div className="text-xs" style={{ color: '#334155' }}>{pt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Topic Suggestions */}
        <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.12)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} color="#a5b4fc" />
            <span className="text-xs font-medium" style={{ color: '#a5b4fc', fontFamily: 'Syne' }}>
              Topic Ideas for Your Niche
            </span>
            <span className="text-xs" style={{ color: '#475569' }}>— 300+ topics, click any to use</span>
          </div>

          {/* Search box */}
          <input
            className="input-field text-sm w-full mb-3"
            placeholder="Search topics... (e.g. n8n, RAG, freelance, pricing)"
            value={topicSearch}
            onChange={(e) => setTopicSearch(e.target.value)}
          />

          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {TOPIC_CATEGORIES.map((cat) => {
              const count = cat.id === 'all'
                ? TOPIC_SUGGESTIONS.length
                : cat.id === 'trending'
                  ? TOPIC_SUGGESTIONS.filter((t) => t.trending).length
                  : TOPIC_SUGGESTIONS.filter((t) => t.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setTopicCategory(cat.id)}
                  className="text-xs px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                  style={{
                    background: topicCategory === cat.id ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${topicCategory === cat.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
                    color: topicCategory === cat.id ? '#a5b4fc' : '#475569',
                  }}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                  <span className="ml-0.5" style={{ color: '#334155', fontSize: '10px' }}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Topic cards — scrollable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
            {TOPIC_SUGGESTIONS
              .filter((t) => {
                if (topicCategory === 'trending') return t.trending;
                if (topicCategory !== 'all' && t.category !== topicCategory) return false;
                if (topicSearch && !t.topic.toLowerCase().includes(topicSearch.toLowerCase())) return false;
                return true;
              })
              .slice(0, 60) // cap render to keep DOM fast
              .map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => setForm({ ...form, topic: suggestion.topic, postType: suggestion.postType })}
                  className="text-left p-2.5 rounded-lg transition-all flex items-start gap-2"
                  style={{
                    background: form.topic === suggestion.topic ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${form.topic === suggestion.topic ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <span className="text-sm flex-shrink-0 mt-0.5">{suggestion.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs leading-relaxed" style={{ color: '#cbd5e1' }}>
                      {suggestion.topic}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs" style={{ color: '#475569' }}>{suggestion.postType}</span>
                      {suggestion.trending && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: '#fcd34d', fontSize: '9px' }}>
                          🔥 trending
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b', fontFamily: 'Syne' }}>
              Post Topic *
            </label>
            <input
              className="input-field text-sm"
              placeholder="Pick a topic above or write your own..."
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b', fontFamily: 'Syne' }}>Industry</label>
            <select
              className="input-field text-sm"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              style={{ cursor: 'pointer' }}
            >
              {INDUSTRIES.map((i) => <option key={i} value={i} style={{ background: '#0f172a' }}>{i}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#64748b', fontFamily: 'Syne' }}>Target Audience</label>
            <input
              className="input-field text-sm"
              placeholder="CTOs, Startup Founders..."
              value={form.targetAudience}
              onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
            />
          </div>
        </div>

        <button
          className="btn-primary flex items-center gap-2 w-full justify-center"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Wand2 size={15} />}
          {loading ? 'Crafting Viral Post...' : 'Generate LinkedIn Post'}
        </button>
      </div>

      {/* Generated Post Preview */}
      {generated && (
        <div className="glass-card p-5 animate-fadeUp" style={{ border: '1px solid rgba(6,182,212,0.2)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye size={14} color="#06b6d4" />
              <span className="text-sm font-medium" style={{ color: '#67e8f9', fontFamily: 'Syne' }}>Post Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="tag tag-cyan flex items-center gap-1">
                <TrendingUp size={10} />
                Est. 2K+ impressions
              </span>
              <span className="tag tag-amber">Best: 9AM–11AM</span>
            </div>
          </div>

          {/* Hook highlight */}
          {generated.hook && (
            <div className="mb-3 p-3 rounded-lg" style={{
              background: 'rgba(6,182,212,0.06)',
              border: '1px solid rgba(6,182,212,0.15)',
            }}>
              <div className="text-xs mb-1" style={{ color: '#06b6d4' }}>🎯 Hook (visible before &quot;see more&quot;):</div>
              <p className="text-sm font-medium" style={{ color: '#e2e8f0' }}>{generated.hook}</p>
            </div>
          )}

          {editing ? (
            <textarea
              className="input-field text-sm w-full resize-none mb-3"
              rows={10}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
          ) : (
            <div className="text-sm p-4 rounded-xl mb-3 whitespace-pre-wrap leading-relaxed" style={{
              background: 'rgba(6,182,212,0.04)',
              border: '1px solid rgba(6,182,212,0.1)',
              color: '#cbd5e1',
            }}>
              {generated.content}
            </div>
          )}

          {/* Hashtags */}
          {!editing && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {generated.hashtags.map((tag) => (
                <span key={tag} className="tag tag-cyan flex items-center gap-1 text-xs">
                  <Hash size={9} />
                  {tag.replace('#', '')}
                </span>
              ))}
            </div>
          )}

          {/* Image Generator */}
          <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Image size={14} color="#a5b4fc" />
              <span className="text-xs font-medium" style={{ color: '#a5b4fc', fontFamily: 'Syne' }}>Post Image</span>
              <span className="text-xs" style={{ color: '#475569' }}>— text cards stop the scroll on LinkedIn</span>
            </div>

            {/* Family filter tabs */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {IMAGE_FAMILIES.map((f) => {
                const count = f.id === 'all'
                  ? IMAGE_STYLE_OPTIONS.length
                  : IMAGE_STYLE_OPTIONS.filter((s) => s.family === f.id).length;
                return (
                  <button
                    key={f.id}
                    onClick={() => setImageFamily(f.id)}
                    className="text-xs px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                    style={{
                      background: imageFamily === f.id ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${imageFamily === f.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
                      color: imageFamily === f.id ? '#a5b4fc' : '#475569',
                    }}
                  >
                    <span>{f.emoji}</span>
                    {f.label}
                    <span className="ml-0.5" style={{ color: '#334155', fontSize: '10px' }}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Style selector */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 max-h-72 overflow-y-auto pr-1">
              {IMAGE_STYLE_OPTIONS
                .filter((s) => imageFamily === 'all' || s.family === imageFamily)
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setImageStyle(s.id); setGeneratedImage(null); }}
                    className="flex items-center gap-2 p-2 rounded-lg text-xs transition-all text-left"
                    style={{
                      background: imageStyle === s.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${imageStyle === s.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <div className="w-8 h-6 rounded flex-shrink-0" style={{
                      background: `linear-gradient(135deg, ${s.preview[0]}, ${s.preview[1]})`,
                      border: '1px solid rgba(255,255,255,0.15)',
                    }} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium" style={{ color: imageStyle === s.id ? '#a5b4fc' : '#94a3b8' }}>
                        {s.label}
                      </div>
                      <div style={{ color: '#475569', fontSize: '10px' }}>
                        {s.description}
                      </div>
                    </div>
                  </button>
                ))}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <button
                className="btn-secondary flex items-center gap-2 text-sm"
                onClick={() => {
                  const hookText = generated.hook || finalContent.split('\n')[0] || 'Your key message here';
                  // Pull the second meaningful line as subtext for extra context
                  const lines = finalContent.split('\n').map((l) => l.trim()).filter(Boolean);
                  const subtext = lines.find((l) => l !== hookText && l.length > 20 && l.length < 160);
                  const categoryMap: Record<typeof form.postType, string> = {
                    'thought-leadership': 'INSIGHT',
                    'case-study': 'CASE STUDY',
                    'tips': 'TIPS',
                    'story': 'STORY',
                    'poll': 'POLL',
                    'engagement': 'HOT TAKE',
                  };
                  const img = generatePostImage({
                    hookText,
                    subtext,
                    category: categoryMap[form.postType],
                    authorName: userProfile.name || undefined,
                    authorTitle: userProfile.title || undefined,
                    style: imageStyle,
                  });
                  setGeneratedImage(img);
                  toast.success('Image generated!');
                }}
              >
                <Image size={13} />
                Generate Image
              </button>
              {generatedImage && (
                <button
                  className="btn-primary flex items-center gap-2 text-sm"
                  onClick={() => {
                    downloadImage(generatedImage, `linkedin-post-${Date.now()}.png`);
                    toast.success('Image downloaded!');
                  }}
                >
                  <Download size={13} />
                  Download PNG
                </button>
              )}
            </div>

            {generatedImage && (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={generatedImage} alt="Generated post image" className="w-full h-auto" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="btn-primary flex items-center gap-2 text-sm"
              onClick={() => {
                // If image exists, download it first so user can attach it
                if (generatedImage) {
                  downloadImage(generatedImage, `linkedin-post-${Date.now()}.png`);
                  toast('Image downloaded — attach it in the LinkedIn composer', { icon: '📎', duration: 5000 });
                }
                handlePostToLinkedIn();
              }}
            >
              <ExternalLink size={13} />
              {generatedImage ? 'Download Image & Post' : 'Post to LinkedIn'}
            </button>
            <button
              className="btn-secondary flex items-center gap-2 text-sm"
              onClick={() => { navigator.clipboard.writeText(finalContent); toast.success('Copied!'); }}
            >
              <Copy size={13} />
              Copy
            </button>
            <button
              className="btn-secondary flex items-center gap-2 text-sm"
              onClick={() => setEditing(!editing)}
            >
              {editing ? 'Preview' : 'Edit'}
            </button>
            <button className="btn-secondary flex items-center gap-2 text-sm" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      )}

      {/* Saved Posts */}
      {posts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3" style={{ color: '#64748b', fontFamily: 'Syne' }}>
            Saved Posts ({posts.length})
          </h3>
          <div className="space-y-3">
            {posts.map((p) => (
              <div key={p.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="tag tag-cyan text-xs">{p.postType}</span>
                      <span className="tag tag-indigo text-xs flex items-center gap-1">
                        <TrendingUp size={9} />
                        {p.estimatedReach.toLocaleString()} reach
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#64748b' }}>{p.content}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        if (isPostTooLongForURL(p.content)) {
                          navigator.clipboard.writeText(p.content);
                          toast.success('Post copied — paste it in LinkedIn!', { duration: 5000 });
                        }
                        window.open(buildLinkedInPostURL(p.content), '_blank');
                      }}
                      className="btn-primary text-xs px-2.5 py-1.5 flex items-center gap-1"
                    >
                      <ExternalLink size={11} /> Post
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(p.content); toast.success('Copied!'); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg"
                      style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                      <Copy size={12} color="#67e8f9" />
                    </button>
                    <button onClick={() => { deletePost(p.id); toast.success('Deleted'); }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg"
                      style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}>
                      <Trash2 size={12} color="#f87171" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
