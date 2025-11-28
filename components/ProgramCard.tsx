
import React from 'react';
import { MapPin, Users, Home, ArrowRight } from 'lucide-react';
import { Program } from '../types';

interface ProgramCardProps {
  program: Program;
  onSelect: (program: Program) => void;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ program, onSelect }) => {
  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group flex flex-col h-full"
      onClick={() => onSelect(program)}
    >
      <div className="relative h-56 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors z-10"></div>
        <img 
          src={program.heroImage} 
          alt={program.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-4 right-4 z-20">
             {/* Changed uppercase to capitalize here */}
             <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full capitalize tracking-wide shadow-sm">
                {program.city}
             </span>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-slate-800 mb-3 leading-tight group-hover:text-blue-600 transition-colors capitalize">{program.name}</h3>
        
        <div className="space-y-3 mb-6 flex-grow">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="truncate">{program.location}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <Users className="w-4 h-4 text-orange-500 shrink-0" />
            <span>{program.ageRange}</span>
          </div>
           <div className="flex items-center gap-3 text-slate-500 text-sm">
            <Home className="w-4 h-4 text-purple-500 shrink-0" />
            <span className="truncate">{program.accommodationType}</span>
          </div>
        </div>

        <div className="pt-5 border-t border-slate-100 flex justify-end items-center mt-auto">
          <button className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgramCard;
