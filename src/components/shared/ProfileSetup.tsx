import React, { useState } from 'react';
import { Save, User, Briefcase, Target, Code2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function ProfileSetup({ onClose }: { onClose?: () => void }) {
  const { userProfile, setUserProfile } = useStore();
  const [form, setForm] = useState({ ...userProfile });
  const [skillInput, setSkillInput] = useState('');

  const addSkill = () => {
    if (!skillInput.trim() || form.skills.includes(skillInput.trim())) return;
    setForm({ ...form, skills: [...form.skills, skillInput.trim()] });
    setSkillInput('');
  };

  const removeSkill = (s: string) => {
    setForm({ ...form, skills: form.skills.filter((sk) => sk !== s) });
  };

  const handleSave = () => {
    setUserProfile(form);
    toast.success('Profile saved!');
    onClose?.();
  };

  return (
    <div className="glass-card p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3A8FA3, #1E6F70)' }}>
          <User size={18} color="white" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white" style={{ fontFamily: 'Syne' }}>Your Profile</h2>
          <p className="text-xs" style={{ color: '#6E7F86' }}>Used to personalize AI-generated messages and posts</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
              <User size={11} className="inline mr-1" />Your Name
            </label>
            <input className="input-field text-sm" placeholder="Ahmad / Your Name"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
              <Briefcase size={11} className="inline mr-1" />Your Title
            </label>
            <input className="input-field text-sm" placeholder="Full Stack Developer"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
            Your Service / Offer
          </label>
          <input className="input-field text-sm"
            placeholder="e.g. Full Stack Web Development, AI Integration, SaaS Development"
            value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
        </div>

        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
            <Target size={11} className="inline mr-1" />Target Audience
          </label>
          <input className="input-field text-sm"
            placeholder="e.g. SaaS Startups, FinTech Companies, E-Commerce Brands"
            value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} />
        </div>

        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: '#6E7F86', fontFamily: 'Syne' }}>
            <Code2 size={11} className="inline mr-1" />Skills & Technologies
          </label>
          <div className="flex gap-2 mb-2">
            <input className="input-field text-sm flex-1"
              placeholder="React, Node.js, Python, AI Integration..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addSkill(); }} />
            <button className="btn-secondary px-3 text-sm" onClick={addSkill}>Add</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {form.skills.map((s) => (
              <span key={s} className="tag tag-indigo flex items-center gap-1 cursor-pointer" onClick={() => removeSkill(s)}>
                {s} <span style={{ opacity: 0.6 }}>×</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <button className="btn-primary w-full mt-6 flex items-center justify-center gap-2" onClick={handleSave}>
        <Save size={14} />
        Save Profile
      </button>
    </div>
  );
}
