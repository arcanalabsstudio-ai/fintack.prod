import React, { useState } from 'react';
import { Shield, FileText, CheckCircle2, AlertTriangle, X, Lock, Sparkles, Scale, ExternalLink, ArrowRight, LogOut } from 'lucide-react';

interface TermsAgreementScreenProps {
  onAccept: () => void;
  onReturnToLogin?: () => void;
}

export const TermsAgreementScreen: React.FC<TermsAgreementScreenProps> = ({ onAccept, onReturnToLogin }) => {
  const [modalType, setModalType] = useState<'TERMS' | 'PRIVACY' | null>(null);
  const [hasDeclined, setHasDeclined] = useState<boolean>(false);
  const [isCheckedCheckbox, setIsCheckedCheckbox] = useState<boolean>(false);

  const handleConfirmAccept = () => {
    localStorage.setItem('fintack_terms_accepted', 'true');
    localStorage.setItem('fintack_terms_accepted_date', new Date().toISOString());
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020504] text-white flex flex-col justify-between items-center p-4 sm:p-6 overflow-y-auto min-h-screen">
      {/* Background Decorative Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[500px] sm:w-[700px] h-[350px] sm:h-[500px] bg-[#14B8A6]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-[#11241F]/40 rounded-full blur-[100px]" />
      </div>

      {/* Top Brand Bar */}
      <header className="relative z-10 w-full max-w-2xl flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#14B8A6] to-[#00A87D] flex items-center justify-center shadow-[0_0_20px_rgba(20, 184, 166, 0.21)]">
            <span className="text-[#020504] font-black text-lg tracking-tighter">F</span>
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-tight">Fintack</span>
            <span className="text-[#14B8A6] text-xs font-semibold block leading-none">Finanzas Freelance</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onReturnToLogin && (
            <button
              type="button"
              onClick={onReturnToLogin}
              id="btn-terms-return-login"
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-full transition cursor-pointer"
              title="Volver a la pantalla de Login"
            >
              <LogOut className="w-3 h-3 text-amber-400" />
              <span>Volver a Login</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0B1512] rounded-full border border-[#182F2A] text-[11px] text-[#7C9791]">
            <Shield className="w-3.5 h-3.5 text-[#14B8A6]" />
            <span>Seguridad y Privacidad</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-2xl my-auto py-4">
        {!hasDeclined ? (
          <div className="bg-[#0B1512] border border-[#182F2A] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Heading */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center p-3 bg-[#11241F] border border-[#1C3A31] rounded-2xl mb-1 shadow-inner">
                <Scale className="w-7 h-7 text-[#14B8A6]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Términos y Condiciones de Uso
              </h1>
              <p className="text-xs sm:text-sm text-[#7C9791] max-w-md mx-auto">
                Bienvenido a <span className="text-white font-semibold">Fintack</span>. Antes de comenzar a gestionar tus finanzas e impuestos, por favor revisa y acepta los términos del servicio.
              </p>
            </div>

            {/* Core Terms Highlights Box */}
            <div className="bg-[#050D0B] rounded-2xl p-4 sm:p-5 border border-[#182F2A]/90 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#182F2A] text-xs font-bold text-[#14B8A6] uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span>Puntos Clave del Servicio</span>
              </div>

              <div className="space-y-3.5">
                {/* Point 1: Not a certified accountant */}
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-[#11241F] text-[#14B8A6] shrink-0 mt-0.5 border border-[#1C3A31]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed">
                    <strong className="text-white">Herramienta de apoyo:</strong> Fintack es una herramienta tecnológica de organización financiera y <span className="text-emerald-300 font-medium">no sustituye el asesoramiento de un contador o profesional tributario</span> colegiado.
                  </p>
                </div>

                {/* Point 2: Estimations & Jurisdiction */}
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-[#11241F] text-[#14B8A6] shrink-0 mt-0.5 border border-[#1C3A31]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed">
                    <strong className="text-white">Cálculos estimados:</strong> Los cálculos de impuestos, IVA y retenciones son estimados referenciales y pueden variar según la legislación fiscal vigente de tu país o jurisdicción.
                  </p>
                </div>

                {/* Point 3: User Responsibility */}
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-[#11241F] text-[#14B8A6] shrink-0 mt-0.5 border border-[#1C3A31]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed">
                    <strong className="text-white">Responsabilidad de la información:</strong> El usuario es el único responsable de la veracidad, integridad y precisión de los datos y comprobantes ingresados en el sistema.
                  </p>
                </div>

                {/* Point 4: Privacy & Client Storage */}
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-[#11241F] text-[#14B8A6] shrink-0 mt-0.5 border border-[#1C3A31]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <p className="text-xs sm:text-sm text-[#D1D5DB] leading-relaxed">
                    <strong className="text-white">Privacidad y confidencialidad:</strong> Tus transacciones e información sensible se guardan de forma local en tu navegador. No comercializamos ni vendemos tus datos a terceros.
                  </p>
                </div>
              </div>
            </div>

            {/* Checkbox agreement confirmation */}
            <label className="flex items-start gap-3 p-3.5 bg-[#081512] rounded-xl border border-[#182F2A] hover:border-[#14B8A6]/40 transition cursor-pointer group">
              <input
                type="checkbox"
                checked={isCheckedCheckbox}
                onChange={(e) => setIsCheckedCheckbox(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#14B8A6] bg-[#020504] border-[#2A443D] focus:ring-[#14B8A6] focus:ring-offset-0 cursor-pointer accent-[#14B8A6]"
              />
              <span className="text-xs text-[#94A3B8] group-hover:text-[#CBD5E1] transition select-none leading-relaxed">
                He leído y acepto los <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModalType('TERMS'); }} className="text-[#14B8A6] hover:underline font-semibold">Términos y Condiciones</button> y la <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModalType('PRIVACY'); }} className="text-[#14B8A6] hover:underline font-semibold">Política de Privacidad</button> de Fintack.
              </span>
            </label>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmAccept}
                className="w-full py-3.5 px-6 bg-[#14B8A6] hover:bg-[#0D9488] active:scale-[0.99] text-[#020504] font-bold text-sm rounded-xl transition shadow-[0_0_20px_rgba(20, 184, 166, 0.175)] flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Acepto los Términos y Condiciones</span>
                <ArrowRight className="w-4 h-4 transition group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => setHasDeclined(true)}
                className="w-full py-2.5 px-4 bg-transparent hover:bg-[#11241F]/40 text-[#7C9791] hover:text-white font-medium text-xs rounded-xl border border-transparent hover:border-[#182F2A] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>No acepto</span>
              </button>
            </div>

            {/* Links to Full Documents */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-[#7C9791] border-t border-[#182F2A]/60">
              <button
                type="button"
                onClick={() => setModalType('TERMS')}
                className="hover:text-[#14B8A6] transition flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ver Términos Completos</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setModalType('PRIVACY')}
                className="hover:text-[#14B8A6] transition flex items-center gap-1 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Ver Política de Privacidad</span>
              </button>
            </div>
          </div>
        ) : (
          /* Declined View Screen */
          <div className="bg-[#0B1512] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Aceptación de Términos Requerida
              </h2>
              <p className="text-xs sm:text-sm text-[#94A3B8] max-w-md mx-auto leading-relaxed">
                Para garantizar un uso seguro, transparente y conforme a las leyes fiscales, es obligatorio aceptar los Términos y Condiciones para utilizar Fintack.
              </p>
            </div>

            <div className="p-4 bg-[#050D0B] rounded-2xl border border-[#182F2A] text-left text-xs text-[#7C9791] space-y-2">
              <p>• No se ha almacenado ninguna información personal en tu navegador.</p>
              <p>• Puedes revisar los términos en cualquier momento cuando decidas continuar.</p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => setHasDeclined(false)}
                className="w-full py-3 px-6 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] font-bold text-sm rounded-xl transition shadow-[0_0_15px_rgba(20, 184, 166, 0.14)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Revisar y Aceptar Términos</span>
              </button>

              {onReturnToLogin && (
                <button
                  type="button"
                  onClick={onReturnToLogin}
                  id="btn-terms-declined-return-login"
                  className="w-full py-2.5 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 font-semibold text-xs rounded-xl border border-amber-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-amber-400" />
                  <span>Regresar a la pantalla de Login</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  window.location.reload();
                }}
                className="w-full py-2.5 px-4 bg-[#081512] hover:bg-[#11241F] text-[#7C9791] hover:text-white font-medium text-xs rounded-xl border border-[#182F2A] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Salir o Recargar</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-2xl text-center py-2 text-[11px] text-[#4A645F]">
        Fintack © {new Date().getFullYear()} — Plataforma de Gestión Financiera para Profesionales Independientes
      </footer>

      {/* MODAL: FULL TERMS OR PRIVACY POLICY */}
      {modalType && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1512] border border-[#182F2A] rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#182F2A] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#11241F] text-[#14B8A6] rounded-xl border border-[#1C3A31]">
                  {modalType === 'TERMS' ? <Scale className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {modalType === 'TERMS' ? 'Términos y Condiciones Completos' : 'Política de Privacidad'}
                  </h3>
                  <p className="text-[11px] text-[#7C9791]">Última actualización: Agosto 2026</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1.5 text-[#7C9791] hover:text-white hover:bg-[#11241F] rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#94A3B8] leading-relaxed">
              {modalType === 'TERMS' ? (
                <>
                  <section className="space-y-1.5">
                    <h4 className="text-sm font-semibold text-white">1. Objeto y Alcance</h4>
                    <p>
                      Fintack es una plataforma digital diseñada para ayudar a profesionales independientes, freelancers y prestadores de servicios a organizar sus registros de ingresos, egresos y estimaciones tributarias referenciales.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="text-sm font-semibold text-white">2. No Sustitución de Asesoría Contable Profesional</h4>
                    <p className="bg-[#11241F]/40 p-3 rounded-xl border border-[#182F2A] text-emerald-300">
                      <strong>Importante:</strong> Fintack es una herramienta de apoyo y bajo ninguna circunstancia reemplaza o sustituye el asesoramiento de un contador público, asesor fiscal o profesional tributario certificado. Cada usuario debe validar sus declaraciones tributarias con profesionales habilitados en su jurisdicción.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="text-sm font-semibold text-white">3. Estimaciones Fiscales</h4>
                    <p>
                      Los cálculos automáticos de retenciones, IVA e impuesto sobre la renta generados por la aplicación son simulaciones estimadas basadas en los porcentajes y parámetros configurados por el usuario. La legislación fiscal puede variar y estar sujeta a deducciones particulares no contempladas.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="text-sm font-semibold text-white">4. Responsabilidad del Usuario</h4>
                    <p>
                      El usuario declara y garantiza que todos los comprobantes, montos, categorías y datos cargados en el sistema son verídicos, lícitos y precisos. Fintack no se hace responsable de sanciones, multas o discrepancias derivadas de información errónea ingresada por el usuario.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="text-sm font-semibold text-white">5. Uso de Inteligencia Artificial (Escáner de Recibos)</h4>
                    <p>
                      La función de escáner de facturas utiliza modelos de procesamiento de lenguaje natural y visión artificial para extraer datos de imágenes. El usuario debe siempre corroborar visualmente los montos y datos extraídos antes de confirmar su registro contable.
                    </p>
                  </section>
                </>
              ) : (
                <>
                  <section className="space-y-1.5">
                    <h4 className="text-sm font-semibold text-white">1. Almacenamiento Local Primero (Local-First)</h4>
                    <p>
                      Tu privacidad es nuestra prioridad fundamental. Toda la información de tus transacciones, configuraciones fiscales, límites de presupuesto y comprobantes se almacena de forma local y encriptada en el almacenamiento de tu propio navegador web (LocalStorage).
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="text-sm font-semibold text-white">2. No Venta de Datos</h4>
                    <p className="bg-[#11241F]/40 p-3 rounded-xl border border-[#182F2A] text-emerald-300">
                      Nunca vendemos, alquilamos ni compartimos tu información financiera o personal con terceros, agencias de publicidad o entidades comerciales.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="text-sm font-semibold text-white">3. Procesamiento de Recibos e Imágenes</h4>
                    <p>
                      Cuando utilizas el escáner de facturas con IA, la imagen se procesa de forma segura a través de endpoints protegidos exclusivamente para la extracción de texto y cifras, sin retención permanente de archivos en servidores externos.
                    </p>
                  </section>

                  <section className="space-y-1.5">
                    <h4 className="text-sm font-semibold text-white">4. Control Total y Borrado de Datos</h4>
                    <p>
                      En cualquier momento puedes borrar la totalidad de tus datos y restablecer la aplicación desde el panel de Configuración con el botón "Restablecer Datos Demo / Borrar".
                    </p>
                  </section>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#081512] border-t border-[#182F2A] flex justify-end">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-5 py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
