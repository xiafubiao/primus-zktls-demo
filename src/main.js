import { PrimusZKTLS } from '@primuslabs/zktls-js-sdk';

const APP_ID = '0x2dbc71986db3f021ebe16f9920f5956cfca184f9';
const APP_SECRET = '0xe8b4ac305f9896ae939b8b17c635ccd69b08e6d09db26ace8fec5366e96c7d37';
const DEFAULT_TEMPLATE_ID = 'de06fb9d-cdd5-46bd-81ac-878614b4deae';

let userAddress = '';
let isConnected = false;

const btnConnect = document.getElementById('btn-connect');
const btnDisconnect = document.getElementById('btn-disconnect');
const btnAttest = document.getElementById('btn-attest');
const walletStatus = document.getElementById('wallet-status');
const addressInput = document.getElementById('address-input');
const templateInput = document.getElementById('template-input');
const logEl = document.getElementById('log');
const resultEl = document.getElementById('result');

const primusZKTLS = new PrimusZKTLS();

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

function log(msg, type = '') {
  logEl.textContent = msg;
  logEl.className = type;
}

async function initSDK() {
  try {
    await primusZKTLS.init(APP_ID, APP_SECRET);
    console.log('Primus SDK initialized');
    log('SDK ready', 'success');
  } catch (err) {
    log('SDK init failed: ' + err.message, 'error');
  }
}

initSDK();

btnConnect.addEventListener('click', async () => {
  if (!window.ethereum) {
    log('No wallet detected. Enter address manually.', 'error');
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    userAddress = accounts[0];
    isConnected = true;
    btnConnect.style.display = 'none';
    btnDisconnect.style.display = 'inline-block';
    walletStatus.textContent = shortAddr(userAddress);
    walletStatus.style.color = '#22c55e';
    addressInput.value = userAddress;
    updateAttestButton();
  } catch (err) {
    log('Wallet connect failed', 'error');
  }
});

btnDisconnect.addEventListener('click', () => {
  userAddress = '';
  isConnected = false;
  btnConnect.style.display = 'inline-block';
  btnDisconnect.style.display = 'none';
  walletStatus.textContent = 'Not connected';
  walletStatus.style.color = '#94a3b8';
  addressInput.value = '';
  updateAttestButton();
});

if (window.ethereum) {
  window.ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length === 0) {
      btnDisconnect.click();
    } else {
      userAddress = accounts[0];
      walletStatus.textContent = shortAddr(userAddress);
      addressInput.value = userAddress;
    }
  });
}

addressInput.addEventListener('input', updateAttestButton);
templateInput.addEventListener('input', updateAttestButton);

function updateAttestButton() {
  const addr = addressInput.value.trim();
  const template = templateInput.value.trim();
  btnAttest.disabled = !addr || !template;
}

templateInput.value = DEFAULT_TEMPLATE_ID;
updateAttestButton();

btnAttest.addEventListener('click', async () => {
  btnAttest.disabled = true;
  resultEl.textContent = '';
  log('Running attestation...');

  const templateId = templateInput.value.trim();
  const userAddr = addressInput.value.trim();

  try {
    const request = primusZKTLS.generateRequestParams(templateId, userAddr);
    request.setAttMode({ algorithmType: 'proxytls' });

    const requestStr = request.toJsonString();
    const signedRequestStr = await primusZKTLS.sign(requestStr);

    log('Opening Primus extension popup...');
    const attestation = await primusZKTLS.startAttestation(signedRequestStr);

    const verifyResult = await primusZKTLS.verifyAttestation(attestation);
    if (!verifyResult) {
      log('Signature verification failed!', 'error');
      return;
    }

    log('Attestation verified!', 'success');

    let data = attestation.data;
    try {
      data = JSON.parse(attestation.data);
    } catch (_) {}

    console.log('Verified data:', data);
    resultEl.textContent = JSON.stringify(attestation, null, 2);

  } catch (err) {
    const code = err.code || err.errorData?.code || 'unknown';
    const desc = err.message || err.errorData?.desc || JSON.stringify(err);

    if (code === '00004') {
      log('Cancelled by user', 'error');
    } else if (code === '30004') {
      log('Login required in popup', 'error');
    } else if (String(code).startsWith('10')) {
      log('Network error (' + code + '). Try mpctls mode.', 'error');
    } else {
      log('Error (' + code + '): ' + desc, 'error');
    }
    console.error(err);
  } finally {
    btnAttest.disabled = false;
    updateAttestButton();
  }
});