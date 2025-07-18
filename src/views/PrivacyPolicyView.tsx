import React from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";

export const PrivacyPolicyView: React.FC = () => {
  const { dispatch } = useAppContext();

  const handleGoBack = () => {
    dispatch({ type: "SET_VIEW", payload: "main" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            onClick={handleGoBack}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Indietro
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Shield className="w-6 h-6" />
              Privacy Policy
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
            </p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduzione</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Questa Privacy Policy descrive come LearnEnglishVOC ("noi", "nostro") raccoglie, 
                utilizza e protegge le tue informazioni personali quando utilizzi la nostra applicazione.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Informazioni che Raccogliamo</h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-3">
                <div>
                  <h3 className="font-semibold">Informazioni di Account:</h3>
                  <p>• Email address per l'autenticazione</p>
                  <p>• Nome display (opzionale)</p>
                  <p>• Foto profilo (opzionale)</p>
                </div>
                <div>
                  <h3 className="font-semibold">Dati di Apprendimento:</h3>
                  <p>• Parole aggiunte al tuo vocabolario</p>
                  <p>• Risultati dei test e progressi</p>
                  <p>• Statistiche di utilizzo dell'app</p>
                  <p>• Preferenze e impostazioni</p>
                </div>
                <div>
                  <h3 className="font-semibold">Informazioni Tecniche:</h3>
                  <p>• Tipo di dispositivo e browser</p>
                  <p>• Indirizzo IP (anonimizzato)</p>
                  <p>• Timestamp di accesso</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Come Utilizziamo le Tue Informazioni</h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p>• <strong>Fornire il servizio:</strong> Per gestire il tuo account e personalizzare l'esperienza di apprendimento</p>
                <p>• <strong>Monitoraggio progresso:</strong> Per tracciare i tuoi miglioramenti nel vocabolario inglese</p>
                <p>• <strong>Miglioramenti:</strong> Per analizzare l'uso dell'app e migliorare le funzionalità</p>
                <p>• <strong>Supporto:</strong> Per fornire assistenza tecnica e risolvere problemi</p>
                <p>• <strong>Sicurezza:</strong> Per proteggere contro frodi e accessi non autorizzati</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Condivisione delle Informazioni</h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p><strong>Non vendiamo i tuoi dati personali.</strong></p>
                <p>Possiamo condividere informazioni anonimizzate per:</p>
                <p>• Analisi statistiche sull'efficacia dell'apprendimento</p>
                <p>• Ricerca educativa (solo dati aggregati e anonimi)</p>
                <p>• Conformità legale quando richiesto dalla legge</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Sicurezza dei Dati</h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p>Implementiamo misure di sicurezza per proteggere i tuoi dati:</p>
                <p>• Crittografia dei dati in transito e a riposo</p>
                <p>• Autenticazione sicura tramite Firebase</p>
                <p>• Controlli di accesso basati sui ruoli</p>
                <p>• Monitoraggio delle attività sospette</p>
                <p>• Backup regolari e disaster recovery</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. I Tuoi Diritti</h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p>Hai il diritto di:</p>
                <p>• <strong>Accesso:</strong> Richiedere una copia dei tuoi dati personali</p>
                <p>• <strong>Correzione:</strong> Aggiornare informazioni inesatte o incomplete</p>
                <p>• <strong>Cancellazione:</strong> Richiedere la cancellazione del tuo account e dati</p>
                <p>• <strong>Portabilità:</strong> Esportare i tuoi dati in formato leggibile</p>
                <p>• <strong>Limitazione:</strong> Richiedere la limitazione del trattamento</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Conservazione dei Dati</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Conserviamo i tuoi dati per il tempo necessario a fornire il servizio e conformarci agli obblighi legali. 
                I dati di apprendimento vengono conservati per consentire il monitoraggio del progresso a lungo termine.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Cookies e Tecnologie Simili</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Utilizziamo localStorage per salvare le preferenze dell'app e lo stato di autenticazione. 
                Non utilizziamo cookies di tracciamento di terze parti per la pubblicità.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Minori</h2>
              <p className="text-gray-700 dark:text-gray-300">
                La nostra app è progettata per utenti di tutte le età. Per utenti sotto i 13 anni, 
                è richiesto il consenso dei genitori. Non raccogliamo intenzionalmente dati da minori senza consenso appropriato.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Modifiche alla Privacy Policy</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Possiamo aggiornare questa Privacy Policy occasionalmente. Ti notificheremo le modifiche significative 
                tramite l'app o via email. L'uso continuato dell'app costituisce accettazione delle modifiche.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contatti</h2>
              <div className="text-gray-700 dark:text-gray-300">
                <p>Per domande sulla privacy o per esercitare i tuoi diritti, contattaci:</p>
                <p>• Attraverso le impostazioni dell'app</p>
                <p>• Via email (se configurato)</p>
                <p>• Tramite il sistema di supporto integrato</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};