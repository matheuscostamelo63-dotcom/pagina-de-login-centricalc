// Configuração do Supabase
const SUPABASE_URL = "https://mlabsszxdvhdiwxzdqms.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sYWJzc3p4ZHZoZGl3eHpkcW1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5Mzg3NTksImV4cCI6MjA4MjUxNDc1OX0.clM33KMSa2O2rMjd4criJcUZplcLY2PdAh-gaRvSyiE";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// URL de Redirecionamento
const REDIRECT_URL = "https://centricalc.netlify.app/";

// Elementos Comuns
const spinner = document.getElementById('spinner');
const errorAlert = document.getElementById('error-alert');
const successAlert = document.getElementById('success-alert');

async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Erro ao obter IP:', error);
        return null;
    }
}

function showLoading(isLoading) {
    const submitBtn = document.getElementById('submit-btn');
    const submitText = submitBtn.querySelector('span');
    if (isLoading) {
        if (spinner) spinner.style.display = 'block';
        if (submitText) submitText.style.opacity = '0.5';
        submitBtn.disabled = true;
    } else {
        if (spinner) spinner.style.display = 'none';
        if (submitText) submitText.style.opacity = '1';
        submitBtn.disabled = false;
    }
}

function showError(message) {
    if (successAlert) successAlert.style.display = 'none';
    if (errorAlert) {
        errorAlert.textContent = message;
        errorAlert.style.display = 'block';
    }
}

function showSuccess(message) {
    if (errorAlert) errorAlert.style.display = 'none';
    if (successAlert) {
        successAlert.textContent = message;
        successAlert.style.display = 'block';
    }
}

function hideAlerts() {
    if (errorAlert) errorAlert.style.display = 'none';
    if (successAlert) successAlert.style.display = 'none';
}

// Lógica de Login (index.html)
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlerts();
        showLoading(true);

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;
            if (data.session) {
                const accessToken = data.session.access_token;
                const refreshToken = data.session.refresh_token;
                // Redireciona passando o token no hash para o outro domínio capturar
                window.location.href = `${REDIRECT_URL}#access_token=${accessToken}&refresh_token=${refreshToken}`;
            } else if (data.user) {
                window.location.href = REDIRECT_URL;
            }
        } catch (error) {
            console.error('Erro no login:', error.message);
            showError('E-mail ou senha incorretos.');
        } finally {
            showLoading(false);
        }
    });

    const forgotPwd = document.getElementById('forgot-password');
    if (forgotPwd) {
        forgotPwd.addEventListener('click', (e) => {
            // Se estiver na index.html, o link agora redireciona para forgot-password.html
            // Não bloqueamos mais com alert.
        });
    }
}

// Lógica de Recuperação de Senha (forgot-password.html)
const forgotPasswordForm = document.getElementById('forgot-password-form');
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlerts();
        showLoading(true);

        const email = document.getElementById('email').value;

        try {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password.html',
            });

            if (error) throw error;
            showSuccess('Link de recuperação enviado para o seu e-mail!');
            forgotPasswordForm.reset();
        } catch (error) {
            console.error('Erro na recuperação:', error.message);
            showError('Erro ao enviar link de recuperação. Verifique o e-mail informado.');
        } finally {
            showLoading(false);
        }
    });
}

// Lógica de Redefinição de Senha (reset-password.html)
const resetPasswordForm = document.getElementById('reset-password-form');
if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlerts();

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passwordRegex.test(password)) {
            showError('A senha não atende aos requisitos de segurança.');
            return;
        }

        if (password !== confirmPassword) {
            showError('As senhas não coincidem.');
            return;
        }

        showLoading(true);

        try {
            const { error } = await supabaseClient.auth.updateUser({
                password: password
            });

            if (error) throw error;
            showSuccess('Senha redefinida com sucesso! Redirecionando...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        } catch (error) {
            console.error('Erro ao redefinir password:', error.message);
            showError('Erro ao redefinir senha. O link pode ter expirado.');
        } finally {
            showLoading(false);
        }
    });
}

// Lógica de Registro (register.html)
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlerts();

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // 1. Validação de Senha Forte
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passwordRegex.test(password)) {
            showError('A senha não atende aos requisitos de segurança.');
            return;
        }

        if (password !== confirmPassword) {
            showError('As senhas não coincidem.');
            return;
        }

        // 2. Validação dos Termos de Uso
        const termsCheckbox = document.getElementById('terms-checkbox');
        if (termsCheckbox && !termsCheckbox.checked) {
            showError('Você precisa concordar com os Termos de Uso para se cadastrar.');
            return;
        }

        showLoading(true);

        try {
            // 2. Obter IP do usuário para Anti-Abuse
            const userIp = await getUserIP();

            // 3. Verificação Silenciosa de Plano (Whitelist vs Trial)
            const { data: whitelistData, error: whitelistError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            // Se o e-mail estiver na whitelist, usamos o plano que já está lá.
            // Caso contrário, definimos como trial.
            const isPaidUser = !!whitelistData;
            const finalPlanId = isPaidUser ? whitelistData.plan_id : 'trial';
            const finalStatus = isPaidUser ? whitelistData.payment_status : 'trialing';

            // 4. Verificação de Anti-Abuse por IP (Apenas para novos Trial)
            if (!isPaidUser && userIp) {
                const { data: ipData, error: ipError } = await supabaseClient
                    .from('users')
                    .select('id')
                    .eq('registration_ip', userIp)
                    .eq('plan_id', 'trial')
                    .limit(1);

                if (ipData && ipData.length > 0) {
                    throw new Error('Um período de teste já foi utilizado nesta rede/dispositivo. Adquira um plano para continuar.');
                }
            }

            // 5. Cadastro no Supabase Auth
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: username,
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // 4. Sincronização com a tabela public.users
                if (!isPaidUser) {
                    // Novo usuário Trial: Inserimos um novo registro
                    const { error: insertError } = await supabaseClient
                        .from('users')
                        .insert({
                            id: data.user.id,
                            email: email,
                            plan_id: finalPlanId,
                            payment_status: finalStatus,
                            registration_ip: userIp,
                            activated_at: new Date().toISOString()
                        });

                    if (insertError) console.error('Erro ao registrar trial:', insertError.message);
                } else {
                    // Usuário Pago: Atualizamos o ID para vincular à conta Auth recém-criada
                    const { error: updateError } = await supabaseClient
                        .from('users')
                        .update({
                            id: data.user.id,
                            registration_ip: userIp,
                            activated_at: new Date().toISOString()
                        })
                        .eq('email', email);

                    if (updateError) console.error('Erro ao vincular usuário pago:', updateError.message);
                }

                showSuccess('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
                registerForm.reset();
                document.querySelectorAll('.req').forEach(r => r.classList.remove('valid'));
            }
        } catch (error) {
            console.error('Erro no registro:', error.message);
            showError(error.message || 'Erro ao criar conta.');
        } finally {
            showLoading(false);
        }
    });
}
