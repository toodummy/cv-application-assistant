import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';
export default tseslint.config(
 { ignores: ['dist', 'node_modules'] },
 js.configs.recommended,
 ...tseslint.configs.recommended,
 { files: ['src/**/*.{ts,tsx}'], plugins: {'react-hooks': hooks, 'react-refresh': refresh},
   languageOptions: { globals: { window: 'readonly', document:'readonly', navigator:'readonly', Blob:'readonly', URL:'readonly', console:'readonly', localStorage:'readonly', setTimeout:'readonly' } },
   rules: { ...hooks.configs.recommended.rules, 'react-refresh/only-export-components':['warn',{allowConstantExport:true}] } }
);
