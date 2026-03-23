'use client';

import { useState } from 'react';

interface City {
  name: string;
  x: number;
  y: number;
  delivery: string;
  isCapital?: boolean;
}

// City positions projected from real lat/lon (Natural Earth projection)
const cities: City[] = [
  { name: 'Астана', x: 547, y: 137, delivery: 'Отгрузка день в день', isCapital: true },
  { name: 'Алматы', x: 666, y: 373, delivery: '2-3 дня' },
  { name: 'Шымкент', x: 508, y: 400, delivery: '2-3 дня' },
  { name: 'Караганда', x: 583, y: 177, delivery: '1-2 дня' },
  { name: 'Актобе', x: 241, y: 163, delivery: '3-4 дня' },
  { name: 'Атырау', x: 126, y: 258, delivery: '4-5 дней' },
  { name: 'Павлодар', x: 666, y: 103, delivery: '2-3 дня' },
  { name: 'Семей', x: 737, y: 159, delivery: '3-4 дня' },
  { name: 'Костанай', x: 378, y: 75, delivery: '3-4 дня' },
  { name: 'Петропавловск', x: 498, y: 25, delivery: '2-3 дня' },
  { name: 'Уральск', x: 116, y: 134, delivery: '4-5 дней' },
  { name: 'Кызылорда', x: 420, y: 325, delivery: '3-5 дней' },
  { name: 'Тараз', x: 546, y: 383, delivery: '3-4 дня' },
  { name: 'Актау', x: 111, y: 361, delivery: '5-7 дней' },
  { name: 'Талдыкорган', x: 697, y: 320, delivery: '3-4 дня' },
  { name: 'Кокшетау', x: 503, y: 73, delivery: '1-2 дня' },
  { name: 'Туркестан', x: 479, y: 371, delivery: '3-4 дня' },
];

const VB_W = 900;
const VB_H = 460;
const ASTANA = cities.find(c => c.isCapital)!;

// 112-point border extracted from Natural Earth GeoJSON dataset
// Projection: x = (lon - 46.466) / (87.36 - 46.466) * 880 + 10
//             y = (55.385 - lat) / (55.385 - 40.662) * 440 + 10
const kazakhstanPath =
  'M 537.1,402.1 L 524.8,407.6 L 496.4,428.4 L 487.0,449.8 L 479.0,450.0 ' +
  'L 473.1,435.8 L 445.7,434.9 L 441.3,410.4 L 430.9,410.2 L 432.5,380.2 ' +
  'L 406.7,358.4 L 369.8,360.7 L 344.6,365.1 L 324.0,338.1 L 306.4,326.8 ' +
  'L 273.0,305.4 L 269.0,302.8 L 213.6,320.5 L 214.5,430.7 L 203.4,432.1 ' +
  'L 188.4,408.7 L 173.8,400.3 L 149.4,406.6 L 139.9,416.5 L 138.7,409.2 ' +
  'L 144.0,396.8 L 139.9,386.3 L 114.9,376.2 L 105.2,349.3 L 93.3,341.8 ' +
  'L 92.6,332.0 L 113.6,334.9 L 114.4,313.0 L 132.7,308.2 L 151.5,312.6 ' +
  'L 155.4,283.5 L 151.5,265.0 L 130.0,266.4 L 111.7,259.1 L 86.8,272.3 ' +
  'L 66.7,278.5 L 55.8,273.7 L 58.0,258.3 L 44.2,238.4 L 28.3,239.2 ' +
  'L 10.0,218.9 L 22.4,196.3 L 16.1,190.2 L 33.3,157.4 L 55.4,174.7 ' +
  'L 58.1,152.9 L 102.5,120.4 L 136.2,119.6 L 183.6,140.3 L 209.1,152.4 ' +
  'L 231.9,139.8 L 266.0,139.2 L 293.5,154.6 L 299.8,145.8 L 330.0,147.1 ' +
  'L 335.4,132.9 L 300.5,112.4 L 321.2,97.8 L 317.2,89.7 L 337.8,81.9 ' +
  'L 322.3,61.4 L 332.1,51.2 L 412.7,40.8 L 423.2,33.4 L 477.0,22.4 ' +
  'L 496.4,10.0 L 535.0,16.4 L 541.8,47.4 L 564.3,40.1 L 591.9,50.3 ' +
  'L 590.1,66.6 L 610.8,64.9 L 664.7,36.7 L 656.8,46.1 L 684.3,69.2 ' +
  'L 732.4,145.1 L 743.9,129.4 L 773.5,146.7 L 804.4,139.0 L 816.3,144.4 ' +
  'L 826.7,161.6 L 841.7,167.4 L 850.9,180.1 L 878.6,176.1 L 890.0,194.4 ' +
  'L 873.6,214.3 L 855.7,217.1 L 854.7,247.1 L 842.8,260.6 L 800.1,250.7 ' +
  'L 784.5,304.2 L 773.5,310.9 L 730.9,322.8 L 750.3,374.7 L 735.5,382.5 ' +
  'L 737.2,399.6 L 724.0,395.2 L 713.2,384.4 L 681.2,381.3 L 645.5,380.5 ' +
  'L 637.7,383.8 L 607.1,371.2 L 594.9,377.4 L 591.5,395.1 L 556.1,384.8 ' +
  'L 542.0,389.0 L 537.1,402.1 Z';

export default function KazakhstanMap() {
  const [activeCity, setActiveCity] = useState<string | null>(null);

  const activeCityData = activeCity
    ? cities.find(c => c.name === activeCity && !c.isCapital)
    : null;

  return (
    <section className="py-16 md:py-20 bg-[#0D0D0D]">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-10 md:mb-14">
          <span className="text-gold-500 text-sm font-semibold tracking-widest uppercase mb-3 block">
            География доставки
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#F5F5F5] mb-4">
            100% покрытие территории{' '}
            <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
              Казахстана
            </span>
          </h2>
          <p className="text-[#A0A0A0] max-w-2xl mx-auto">
            Прямая логистика из Астаны во все 17 областей.
            Собственный склад — отгрузка день в день.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* SVG map wrapper */}
          <div className="relative">
            <svg
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              className="w-full h-auto block"
              onMouseLeave={() => setActiveCity(null)}
              role="img"
              aria-label="Карта Казахстана с городами доставки"
            >
              <defs>
                <filter id="astanaGlow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <radialGradient id="mapFill" cx="61%" cy="33%" r="55%">
                  <stop offset="0%" stopColor="#1E1E1E" />
                  <stop offset="100%" stopColor="#161616" />
                </radialGradient>
                <radialGradient id="astanaAura" cx="61%" cy="33%" r="30%">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Transparent background — tap to dismiss tooltip */}
              <rect
                x="0" y="0" width={VB_W} height={VB_H}
                fill="transparent"
                onClick={() => setActiveCity(null)}
              />

              {/* Country shape */}
              <path
                d={kazakhstanPath}
                fill="url(#mapFill)"
                stroke="#2A2A2A"
                strokeWidth="1.5"
                onClick={() => setActiveCity(null)}
              />
              {/* Subtle gold inner line */}
              <path
                d={kazakhstanPath}
                fill="none"
                stroke="#D4AF37"
                strokeWidth="0.5"
                opacity="0.15"
                className="pointer-events-none"
              />
              {/* Astana-centred warm glow */}
              <path
                d={kazakhstanPath}
                fill="url(#astanaAura)"
                className="pointer-events-none"
              />

              {/* Delivery rays from Astana */}
              {cities
                .filter(c => !c.isCapital)
                .map((city, i) => (
                  <line
                    key={`ray-${city.name}`}
                    x1={ASTANA.x}
                    y1={ASTANA.y}
                    x2={city.x}
                    y2={city.y}
                    stroke="#D4AF37"
                    strokeWidth="0.75"
                    opacity={activeCity === city.name ? 0.5 : 0.12}
                    strokeDasharray="4 4"
                    className="transition-opacity duration-300 pointer-events-none"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-8"
                      dur={`${1.5 + i * 0.1}s`}
                      repeatCount="indefinite"
                    />
                  </line>
                ))}

              {/* City markers */}
              {cities.map(city => {
                const isActive = activeCity === city.name;

                return (
                  <g
                    key={city.name}
                    className="cursor-pointer"
                    onMouseEnter={() => {
                      if (!city.isCapital) setActiveCity(city.name);
                    }}
                    onClick={() => {
                      if (!city.isCapital) {
                        setActiveCity(activeCity === city.name ? null : city.name);
                      }
                    }}
                  >
                    {/* Invisible touch target */}
                    {!city.isCapital && (
                      <circle cx={city.x} cy={city.y} r="18" fill="transparent" />
                    )}

                    {/* Hover glow ring */}
                    {!city.isCapital && isActive && (
                      <circle
                        cx={city.x}
                        cy={city.y}
                        r="12"
                        fill="rgba(212,175,55,0.08)"
                        className="pointer-events-none"
                      />
                    )}

                    {/* Dot */}
                    <circle
                      cx={city.x}
                      cy={city.y}
                      r={city.isCapital ? 7 : isActive ? 5 : 3.5}
                      fill={
                        city.isCapital
                          ? '#D4AF37'
                          : isActive
                            ? '#D4AF37'
                            : '#F5F5F5'
                      }
                      filter={city.isCapital ? 'url(#astanaGlow)' : undefined}
                      className="transition-all duration-300 pointer-events-none"
                    />

                    {/* Astana pulsing rings */}
                    {city.isCapital && (
                      <>
                        <circle
                          cx={city.x}
                          cy={city.y}
                          r="7"
                          fill="none"
                          stroke="#D4AF37"
                          strokeWidth="2"
                          className="pointer-events-none"
                        >
                          <animate attributeName="r" from="7" to="25" dur="2.5s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.6" to="0" dur="2.5s" repeatCount="indefinite" />
                        </circle>
                        <circle
                          cx={city.x}
                          cy={city.y}
                          r="7"
                          fill="none"
                          stroke="#D4AF37"
                          strokeWidth="1.5"
                          className="pointer-events-none"
                        >
                          <animate attributeName="r" from="7" to="25" dur="2.5s" begin="1.25s" repeatCount="indefinite" />
                          <animate attributeName="opacity" from="0.4" to="0" dur="2.5s" begin="1.25s" repeatCount="indefinite" />
                        </circle>
                      </>
                    )}

                    {/* Astana label — always visible */}
                    {city.isCapital && (
                      <>
                        <text
                          x={city.x}
                          y={city.y - 18}
                          textAnchor="middle"
                          fill="#D4AF37"
                          fontSize="13"
                          fontWeight="700"
                          className="pointer-events-none select-none"
                        >
                          Астана
                        </text>
                        <text
                          x={city.x}
                          y={city.y + 24}
                          textAnchor="middle"
                          fill="#A0A0A0"
                          fontSize="9"
                          className="pointer-events-none select-none"
                        >
                          Центральный склад
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Tooltip overlay — positioned via percentage */}
            {activeCityData && (
              <div
                className="absolute z-10 pointer-events-none"
                style={{
                  left: `${(activeCityData.x / VB_W) * 100}%`,
                  top: `${(activeCityData.y / VB_H) * 100}%`,
                  transform:
                    activeCityData.y < 120
                      ? 'translate(-50%, 12px)'
                      : 'translate(-50%, -100%) translateY(-12px)',
                }}
              >
                <div className="bg-[#252525]/95 backdrop-blur-sm border border-gold-500/30 rounded-lg px-3 py-2 shadow-xl shadow-black/40">
                  <p className="text-[#F5F5F5] text-sm font-semibold whitespace-nowrap">
                    {activeCityData.name}
                  </p>
                  <p className="text-gold-500 text-xs whitespace-nowrap">
                    {activeCityData.delivery}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-500 opacity-40" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gold-500" />
              </span>
              <span className="text-[#A0A0A0]">Центральный склад</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full h-2.5 w-2.5 bg-[#F5F5F5]" />
              <span className="text-[#A0A0A0]">Города доставки</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
