// This component exists because: posts that name a real prospect's pain in
// the prospect's language drive inbound leads from people who feel the same
// way. Phase 4 reshaped it around 4 funnel-tied post types (pain-naming,
// mechanism-reveal, proof, take) and a pipeline-driven topic picker that
// replaces the killed trending-topics engine.

import React, { useState, useMemo, useEffect } from 'react';
import { Wand2, ExternalLink, Copy, Trash2, Hash, Eye, Image, Download, Lightbulb, RefreshCw } from 'lucide-react';
import { useStore } from '@/lib/store';
import { generateLinkedInPost, generateLibraryTopics } from '@/lib/ai';
import { buildLinkedInPostURL, isPostTooLongForURL, INDUSTRIES } from '@/lib/utils';
import { generatePostImage, downloadImage, IMAGE_STYLE_OPTIONS, IMAGE_FAMILIES, type ImageStyle } from '@/lib/postImage';
import { TOPIC_SUGGESTIONS, TOPIC_CATEGORIES, type TopicSuggestion } from '@/lib/postTopics';
import { STRATEGIC_POST_TYPES, primaryIcpLabel } from '@/lib/icp';
import type { LinkedInPost, LinkedInPostType } from '@/lib/types';
import IcpTagPicker from '@/components/icp/IcpTagPicker';
import PipelineTopicPicker from '@/components/icp/PipelineTopicPicker';
import toast from 'react-hot-toast';

const STRATEGIC_TYPES: LinkedInPostType[] = ['pain-naming', 'mechanism-reveal', 'proof', 'take'];

// 48h cache TTL — matches the project-wide pattern for AI-generated content.
const LIBRARY_TTL_MS = 48 * 60 * 60 * 1000;

export default function LinkedInPostGenerator() {
  const {
    posts, addPost, deletePost, userProfile, userPositioning,
    libraryTopics, libraryTopicsGeneratedAt, setLibraryTopics,
  } = useStore();
  const defaultIcp = primaryIcpLabel(userPositioning);
  const [form, setForm] = useState({
    topic: '',
    postType: 'pain-naming' as LinkedInPostType,
    industry: 'Technology',
    targetAudience: userPositioning?.targetCompanyType || userProfile.targetAudience,
    icpTag: defaultIcp,
    pipelineContext: '',
  });
  const [generated, setGenerated] = useState<{ content: string; hashtags: string[]; hook: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [imageStyle, setImageStyle] = useState<ImageStyle>('hook-indigo');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [topicCategory, setTopicCategory] = useState<string>('trending');
  const [topicSearch, setTopicSearch] = useState('');
  const [imageFamily, setImageFamily] = useState<string>('all');
  const [libraryLoading, setLibraryLoading] = useState(false);

  // Cached AI topics are the primary library; hardcoded TOPIC_SUGGESTIONS is
  // the offline fallback. The shape matches TopicSuggestion (minus the id,
  // which we synthesize from index since IDs aren't load-bearing here).
  const displayedLibrary: TopicSuggestion[] = useMemo(() => {
    if (libraryTopics.length > 0) {
      return libraryTopics.map((t, i) => ({
        id: `ai-topic-${i}`,
        topic: t.topic,
        postType: t.postType,
        category: t.category,
        emoji: t.emoji,
        trending: t.trending,
      }));
    }
    return TOPIC_SUGGESTIONS;
  }, [libraryTopics]);

  const isLibraryStale = useMemo(() => {
    if (!libraryTopicsGeneratedAt) return true;
    return Date.now() - new Date(libraryTopicsGeneratedAt).getTime() > LIBRARY_TTL_MS;
  }, [libraryTopicsGeneratedAt]);

  const refreshLibrary = async () => {
    setLibraryLoading(true);
    try {
      const topics = await generateLibraryTopics(userPositioning, 70);
      if (topics.length === 0) {
        toast.error('AI returned no topics — falling back to the curated list');
        return;
      }
      setLibraryTopics(topics);
      toast.success(`Generated ${topics.length} fresh topics`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Topic refresh failed: ${msg}`);
    } finally {
      setLibraryLoading(false);
    }
  };

  // Auto-generate on first library open when the cache is empty or expired.
  // Keeps the UX smooth without forcing the user to hit refresh manually.
  useEffect(() => {
    if (showLibrary && libraryTopics.length === 0 && !libraryLoading) {
      refreshLibrary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLibrary]);

  const handleGenerate = async () => {
    if (!form.topic) { toast.error('Pick a prospect pain or write your own topic first'); return; }
    setLoading(true);
    try {
      const result = await generateLinkedInPost({
        topic: form.topic,
        postType: form.postType,
        industry: form.industry,
        targetAudience: form.targetAudience,
        yourSkills: userProfile.skills,
        positioning: userPositioning,
        icpTag: form.icpTag,
        pipelineContext: form.pipelineContext || undefined,
      });
      setGenerated(result);
      setEditContent(result.content + '\n\n' + result.hashtags.map((h) => `#${h.replace('#', '')}`).join(' '));
      toast.success('Post generated!');
    } catch {
      toast.error('Failed. Check your API key.');
    }
    setLoading(false);
  };

  const finalContent = editing
    ? editContent
    : (generated ? `${generated.content}\n\n${generated.hashtags.map((h) => `#${h.replace('#', '')}`).join(' ')}` : '');

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
      icpTag: form.icpTag,
      // Real reach comes from LinkedIn after publish — Phase 5 will wire it.
      estimatedReach: 0,
      bestTimeToPost: '',
      createdAt: new Date().toISOString(),
    };
    addPost(post);
    toast.success('Post saved');
  };

  return (
    <div className="space-y-6">
      {/* Generator */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-sm mb-4" style={{ color: '#1E6F70', fontFamily: 'Syne' }}>
          AI LinkedIn Post Generator
        </h3>

        {/* Strategic post type selector — Phase 4 */}
        <div className="mb-4">
          <label className="text-xs font-medium block mb-2" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
            Post type — pick the funnel objective
          </label>
          <div className="grid grid-cols-2 gap-2">
            {STRATEGIC_TYPES.map((t) => {
              const meta = STRATEGIC_POST_TYPES[t]!;
              const isActive = form.postType === t;
              return (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, postType: t })}
                  className="p-3 rounded-xl text-left transition-all"
                  style={{
                    background: isActive ? 'rgba(58,143,163,0.18)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? 'rgba(58,143,163,0.5)' : 'rgba(255,255,255,0.07)'}`,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span>{meta.emoji}</span>
                    <span className="text-xs font-semibold" style={{ color: isActive ? '#1E6F70' : '#D6CCB6' }}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: '#6E7F86' }}>
                    {meta.funnelObjective}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ICP tag */}
        <div className="mb-4">
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
            Target ICP
          </label>
          <IcpTagPicker
            value={form.icpTag}
            onChange={(tag) => setForm({ ...form, icpTag: tag })}
          />
        </div>

        {/* Pipeline topic picker — replaces trending topics */}
        <div className="mb-4">
          <PipelineTopicPicker
            onPick={(topic) => {
              setForm({
                ...form,
                topic: topic.text.slice(0, 200),
                pipelineContext: topic.text,
              });
              toast.success(`Using ${topic.leadName}'s ${topic.source} as topic`);
            }}
          />
        </div>

        {/* AI-generated topic library — primary path, hardcoded list is fallback */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLibrary(!showLibrary)}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{
                background: showLibrary ? 'rgba(58,143,163,0.12)' : 'rgba(255,255,255,0.03)',
                color: showLibrary ? '#1E6F70' : '#6E7F86',
                border: '1px solid rgba(58,143,163,0.15)',
              }}
            >
              <Lightbulb size={11} />
              {showLibrary ? 'Hide' : 'Browse'} {libraryTopics.length > 0 ? 'AI topic library' : 'topic library'} ({displayedLibrary.length})
            </button>
            {showLibrary && (
              <button
                onClick={refreshLibrary}
                disabled={libraryLoading}
                className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
                style={{
                  background: 'rgba(58,143,163,0.08)',
                  color: '#1E6F70',
                  border: '1px solid rgba(58,143,163,0.2)',
                  opacity: libraryLoading ? 0.5 : 1,
                }}
                title={libraryTopicsGeneratedAt
                  ? `Last generated ${new Date(libraryTopicsGeneratedAt).toLocaleString()}`
                  : 'Generate fresh topics with AI'}
              >
                <RefreshCw size={11} className={libraryLoading ? 'animate-spin' : ''} />
                {libraryLoading ? 'Generating…' : (libraryTopics.length === 0 ? 'Generate with AI' : 'Refresh')}
              </button>
            )}
          </div>

          {showLibrary && (
            <div className="mt-2 p-4 rounded-xl" style={{
              background: 'rgba(58,143,163,0.04)',
              border: '1px solid rgba(58,143,163,0.12)',
            }}>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                {libraryTopics.length > 0
                  ? <>AI-generated and tailored to your positioning. {isLibraryStale && <span style={{ color: '#D08A3E' }}>(Cache is &gt;48h old — refresh for fresh ideas.)</span>} Topics from your actual prospects (above) still perform better.</>
                  : <>Generic prompts when your pipeline is too thin to inspire one. Topics from your actual prospects (above) almost always perform better.</>}
              </p>
              <input
                className="input-field text-sm w-full mb-3"
                placeholder="Search topics…"
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
              />
              <div className="flex flex-wrap gap-1.5 mb-3">
                {TOPIC_CATEGORIES.map((cat) => {
                  const count = cat.id === 'all'
                    ? displayedLibrary.length
                    : cat.id === 'trending'
                      ? displayedLibrary.filter((t) => t.trending).length
                      : displayedLibrary.filter((t) => t.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setTopicCategory(cat.id)}
                      className="text-xs px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                      style={{
                        background: topicCategory === cat.id ? 'rgba(58,143,163,0.25)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${topicCategory === cat.id ? 'rgba(58,143,163,0.5)' : 'rgba(255,255,255,0.07)'}`,
                        color: topicCategory === cat.id ? '#1E6F70' : '#6E7F86',
                      }}
                    >
                      <span>{cat.emoji}</span>
                      {cat.label}
                      <span className="ml-0.5" style={{ color: '#6E7F86', fontSize: '10px' }}>{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {libraryLoading && displayedLibrary === TOPIC_SUGGESTIONS && libraryTopics.length === 0 ? (
                  <div className="col-span-full flex items-center justify-center py-10 gap-2" style={{ color: 'var(--text-muted)' }}>
                    <RefreshCw size={14} className="animate-spin" />
                    <span className="text-xs">Generating topics tailored to your positioning…</span>
                  </div>
                ) : null}
                {displayedLibrary
                  .filter((t) => {
                    if (topicCategory === 'trending') return t.trending;
                    if (topicCategory !== 'all' && t.category !== topicCategory) return false;
                    if (topicSearch && !t.topic.toLowerCase().includes(topicSearch.toLowerCase())) return false;
                    return true;
                  })
                  .slice(0, 60)
                  .map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => setForm({ ...form, topic: suggestion.topic, pipelineContext: '' })}
                      className="text-left p-2.5 rounded-lg transition-all flex items-start gap-2"
                      style={{
                        background: form.topic === suggestion.topic ? 'rgba(58,143,163,0.18)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${form.topic === suggestion.topic ? 'rgba(58,143,163,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      <span className="text-sm flex-shrink-0 mt-0.5">{suggestion.emoji}</span>
                      <div className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {suggestion.topic}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Topic + audience inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
              Post topic *
            </label>
            <input
              className="input-field text-sm"
              placeholder="Pick from prospects above or write your own…"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
            />
            {form.pipelineContext && (
              <p className="text-xs mt-1" style={{ color: '#1E6F70' }}>
                ✓ Grounded in real pipeline context — won't be generic
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>Industry</label>
            <select
              className="input-field text-sm"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              style={{ cursor: 'pointer' }}
            >
              {INDUSTRIES.map((i) => <option key={i} value={i} style={{ background: '#F7F2E7' }}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>Target audience</label>
            <input
              className="input-field text-sm"
              placeholder="CTOs, Startup Founders…"
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
          {loading ? 'Generating Post…' : `Generate ${STRATEGIC_POST_TYPES[form.postType]?.label || 'Post'}`}
        </button>
      </div>

      {/* Preview */}
      {generated && (
        <div className="glass-card p-5 animate-fadeUp" style={{ border: '1px solid rgba(30,111,112,0.2)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Eye size={14} color="#1E6F70" />
              <span className="text-sm font-medium" style={{ color: '#1E6F70', fontFamily: 'Syne' }}>Post Preview</span>
            </div>
            <span className="text-xs" style={{ color: '#6E7F86' }}>
              Reach reported by LinkedIn after you post.
            </span>
          </div>

          {generated.hook && (
            <div className="mb-3 p-3 rounded-lg" style={{
              background: 'rgba(30,111,112,0.06)',
              border: '1px solid rgba(30,111,112,0.15)',
            }}>
              <div className="text-xs mb-1" style={{ color: '#1E6F70' }}>🎯 Hook (visible before &quot;see more&quot;):</div>
              <p className="text-sm font-medium" style={{ color: '#E6DCC8' }}>{generated.hook}</p>
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
              background: 'rgba(30,111,112,0.04)',
              border: '1px solid rgba(30,111,112,0.1)',
              color: 'var(--text-primary)',
            }}>
              {generated.content}
            </div>
          )}

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

          {/* Image */}
          <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Image size={14} color="#1E6F70" />
              <span className="text-xs font-medium" style={{ color: '#1E6F70', fontFamily: 'Syne' }}>Post image</span>
              <span className="text-xs" style={{ color: '#6E7F86' }}>— text cards stop the scroll on LinkedIn</span>
            </div>

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
                      background: imageFamily === f.id ? 'rgba(58,143,163,0.25)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${imageFamily === f.id ? 'rgba(58,143,163,0.5)' : 'rgba(255,255,255,0.07)'}`,
                      color: imageFamily === f.id ? '#1E6F70' : '#6E7F86',
                    }}
                  >
                    <span>{f.emoji}</span>
                    {f.label}
                    <span className="ml-0.5" style={{ color: '#6E7F86', fontSize: '10px' }}>{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 max-h-72 overflow-y-auto pr-1">
              {IMAGE_STYLE_OPTIONS
                .filter((s) => imageFamily === 'all' || s.family === imageFamily)
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setImageStyle(s.id); setGeneratedImage(null); }}
                    className="flex items-center gap-2 p-2 rounded-lg text-xs transition-all text-left"
                    style={{
                      background: imageStyle === s.id ? 'rgba(58,143,163,0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${imageStyle === s.id ? 'rgba(58,143,163,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    <div className="w-8 h-6 rounded flex-shrink-0" style={{
                      background: `linear-gradient(135deg, ${s.preview[0]}, ${s.preview[1]})`,
                      border: '1px solid rgba(255,255,255,0.15)',
                    }} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium" style={{ color: imageStyle === s.id ? '#1E6F70' : '#6E7F86' }}>
                        {s.label}
                      </div>
                      <div style={{ color: '#6E7F86', fontSize: '10px' }}>
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
                  const lines = finalContent.split('\n').map((l) => l.trim()).filter(Boolean);
                  const subtext = lines.find((l) => l !== hookText && l.length > 20 && l.length < 160);
                  const meta = STRATEGIC_POST_TYPES[form.postType];
                  const category = meta ? meta.label.toUpperCase() : 'POST';
                  const img = generatePostImage({
                    hookText,
                    subtext,
                    category,
                    authorName: userProfile.name || undefined,
                    authorTitle: userProfile.title || undefined,
                    style: imageStyle,
                  });
                  setGeneratedImage(img);
                  toast.success('Image generated');
                }}
              >
                <Image size={13} />
                Generate image
              </button>
              {generatedImage && (
                <button
                  className="btn-primary flex items-center gap-2 text-sm"
                  onClick={() => {
                    downloadImage(generatedImage, `linkedin-post-${Date.now()}.png`);
                    toast.success('Image downloaded');
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
              onClick={() => { navigator.clipboard.writeText(finalContent); toast.success('Copied'); }}
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
          <h3 className="text-sm font-medium mb-3" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
            Saved Posts ({posts.length})
          </h3>
          <div className="space-y-3">
            {posts.map((p) => {
              const meta = STRATEGIC_POST_TYPES[p.postType];
              return (
                <div key={p.id} className="glass-card p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="tag tag-cyan text-xs">
                          {meta ? `${meta.emoji} ${meta.label}` : p.postType}
                        </span>
                        {p.icpTag && (
                          <span className="text-xs px-2 py-0.5 rounded" style={{
                            background: 'rgba(58,143,163,0.12)',
                            color: '#1E6F70',
                          }}>
                            {p.icpTag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#6E7F86' }}>{p.content}</p>
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
                      <button onClick={() => { navigator.clipboard.writeText(p.content); toast.success('Copied'); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg"
                        style={{ background: 'rgba(30,111,112,0.1)', border: '1px solid rgba(30,111,112,0.2)' }}>
                        <Copy size={12} color="#1E6F70" />
                      </button>
                      <button onClick={() => { deletePost(p.id); toast.success('Deleted'); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg"
                        style={{ background: 'rgba(176,67,42,0.1)', border: '1px solid rgba(176,67,42,0.2)' }}>
                        <Trash2 size={12} color="#CC6B4F" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
