import { generateBroker } from 'moleculer-ts';
import * as path from 'path';

(async () => {
  const brokerRootDir = `${process.cwd()}/src`;
    console.log("adssd: ", `${path.join(process.cwd(), 'services')}/*.service.types.ts`)
  await generateBroker({
    serviceTypesPattern : `${path.join(process.cwd(), 'services')}/*.service.types.ts`, //serviceTypesPattern: `${brokerRootDir}/**/*.service.types.ts`,
    outputDir: `${brokerRootDir}/types`,
  });
})();