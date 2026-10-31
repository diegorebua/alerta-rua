import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, PlusCircle, Search, CheckCircle2, type LucideIcon } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface Step {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge: string;
}

const steps: Step[] = [
  {
    number: '01',
    title: 'Sinalize o Problema na Via',
    description:
      'Encontrou um buraco no asfalto, poste apagado, vazamento ou descarte irregular? Clique em Reportar e informe o endereço com georreferenciamento automático.',
    icon: PlusCircle,
    badge: 'REPORTE GEORREFERENCIADO',
  },
  {
    number: '02',
    title: 'Monitore o Radar do Bairro',
    description:
      'Use a busca rápida e os filtros de status na central lateral para inspecionar sua rua ou bairro em tempo real.',
    icon: Search,
    badge: 'BUSCA & FILTRAGEM',
  },
  {
    number: '03',
    title: 'Inspeção no Mapa Interativo',
    description:
      'Clique nas marcações coloridas no mapa (vermelho para aberta, âmbar para em andamento e verde para resolvida) para abrir a ficha completa da ocorrência.',
    icon: MapPin,
    badge: 'CARTOGRAFIA VIVA',
  },
  {
    number: '04',
    title: 'Acompanhamento e Resolução',
    description:
      'As ocorrências ficam registradas de forma transparente para que moradores e órgãos públicos acompanhem a evolução até o reparo.',
    icon: CheckCircle2,
    badge: 'ZELADORIA COLABORATIVA',
  },
];

export default function Instructions() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      gsap.from('.inst-animate', {
        y: 22,
        opacity: 0,
        duration: 0.55,
        stagger: 0.09,
        ease: 'power3.out',
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="min-h-[calc(100vh-65px)] bg-urban-grid-light py-14 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="inst-animate text-center mb-12">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight mb-3">
            Como funciona o Alerta Rua?
          </h1>
          <p className="text-zinc-600 text-[15px] leading-relaxed max-w-xl mx-auto">
            Uma central colaborativa para mapear, priorizar e acompanhar problemas de infraestrutura
            nas vias da cidade.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="inst-animate card-hover flex flex-col justify-between bg-white border border-zinc-200/90 rounded-2xl p-6 relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 text-amber-400 flex items-center justify-center shadow-sm">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono-tech text-xs font-bold text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-md">
                      ETAPA {step.number}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono-tech uppercase tracking-widest text-amber-600 font-semibold block mb-1">
                    {step.badge}
                  </span>
                  <h3 className="font-display text-[17px] font-bold text-zinc-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="inst-animate mt-10 bg-zinc-950 text-zinc-100 rounded-2xl p-7 flex flex-col sm:flex-row items-center justify-between gap-4 border border-zinc-800 shadow-lg">
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              Pronto para inspecionar sua região?
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Acesse o mapa em tempo real ou cadastre uma nova ocorrência agora.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-amber-500 text-zinc-950 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-amber-400 transition shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            <MapPin className="w-4 h-4" />
            Abrir Mapa Urbano
          </Link>
        </div>
      </div>
    </div>
  );
}
