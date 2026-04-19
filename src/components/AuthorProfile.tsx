import React from 'react';
import { motion } from 'motion/react';
import { Twitter, Linkedin, Facebook, Mail, Instagram, ArrowLeft, FileText, Globe } from 'lucide-react';
import { Author, Article } from '../types';
import { cn, optimizeImage } from '../lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AuthorProfileProps {
  author: Author;
  articles: Article[];
  onBack: () => void;
  onArticleClick: (article: Article) => void;
}

export const AuthorProfile: React.FC<AuthorProfileProps> = ({ 
  author, 
  articles, 
  onBack, 
  onArticleClick 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto py-12 px-6"
    >
      <button 
        onClick={onBack}
        className="group flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold text-sm mb-12"
      >
        <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
        Retour à l'actualité
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
        {/* Left Sidebar: Author Info */}
        <div className="lg:col-span-1 space-y-8 sticky top-32">
          <div className="relative">
            <div className="aspect-square rounded-[40px] overflow-hidden shadow-2xl border-4 border-white">
              <img 
                src={optimizeImage(author.image, 600)} 
                alt={author.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-primary text-white p-4 rounded-3xl shadow-xl">
              <FileText size={24} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900">{author.name}</h1>
              <p className="text-primary font-bold text-lg">{author.role} @ Akwaba Info</p>
            </div>

            <p className="text-slate-600 leading-relaxed font-serif text-lg italic">
              "{author.bio}"
            </p>

            <div className="flex flex-wrap gap-2 pt-4">
              {author.specialties.map(spec => (
                <span 
                  key={spec}
                  className="px-4 py-1.5 bg-beige border border-slate-200 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wider"
                >
                  {spec}
                </span>
              ))}
            </div>

            <div className="pt-8 border-t border-slate-200">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Connecter avec l'auteur</h3>
              <div className="flex gap-4">
                {author.socials.twitter && (
                  <a href={author.socials.twitter} target="_blank" rel="noopener noreferrer" className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-400 hover:text-primary hover:shadow-md transition-all">
                    <Twitter size={20} />
                  </a>
                )}
                {author.socials.linkedin && (
                  <a href={author.socials.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-400 hover:text-primary hover:shadow-md transition-all">
                    <Linkedin size={20} />
                  </a>
                )}
                {author.socials.instagram && (
                  <a href={author.socials.instagram} target="_blank" rel="noopener noreferrer" className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-400 hover:text-primary hover:shadow-md transition-all">
                    <Instagram size={20} />
                  </a>
                )}
                {author.socials.facebook && (
                  <a href={author.socials.facebook} target="_blank" rel="noopener noreferrer" className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-400 hover:text-primary hover:shadow-md transition-all">
                    <Facebook size={20} />
                  </a>
                )}
                {author.socials.mail && (
                  <a href={`mailto:${author.socials.mail}`} className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-400 hover:text-primary hover:shadow-md transition-all">
                    <Mail size={20} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Content: Articles List */}
        <div className="lg:col-span-2 space-y-10">
          <div className="flex items-end justify-between border-b border-slate-200 pb-6">
            <h2 className="text-3xl font-black tracking-tighter">Publications</h2>
            <span className="text-slate-400 font-bold text-sm">{articles.length} article{articles.length > 1 ? 's' : ''} publié{articles.length > 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-8">
            {articles.map((article, idx) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => onArticleClick(article)}
                className="group cursor-pointer grid grid-cols-1 md:grid-cols-4 gap-6 items-center"
              >
                <div className="md:col-span-1">
                  <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-md">
                    <img 
                      src={optimizeImage(article.image || '', 400)} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div className="md:col-span-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                      {article.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {format(new Date(article.date), 'dd MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight">
                    {article.title}
                  </h3>
                  <p className="text-slate-500 line-clamp-2 text-sm leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
              </motion.div>
            ))}

            {articles.length === 0 && (
              <div className="py-20 text-center space-y-4 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                <Globe size={48} className="mx-auto text-slate-100" />
                <p className="text-slate-400 font-bold">Aucun article publié pour le moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
