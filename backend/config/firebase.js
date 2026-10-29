import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import serviceAccount from './serviceAccountKey.json' with { type: 'json' };

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

export const firebaseAuth = getAuth(app);

export default app;

async function main() {
  try {
    const result = await firebaseAuth.listUsers(1);

    console.log('Firebase conectado correctamente');
    console.log('Proyecto:', serviceAccount.project_id);
    console.log('Usuarios registrados:', result.users.length);
  } catch (error) {
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    console.error('Detalles:', error.errorInfo);
    process.exitCode = 1;
  }
}

main();