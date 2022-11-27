import { Config, ValidConfigKeys } from '../configLoader';

export const title = 'config-debug-menu';

export class ConfigDebugMenu extends Phaser.Scene {
  CONFIG_CONTAINER = '#config-debug';

  constructor() {
    super(title);
  }

  create() {
    function handleConfigChange(event: Event) {
      const target = event.target as HTMLInputElement;

      const key = target.id as ValidConfigKeys;
      const value = target.classList.contains('number')
        ? parseFloat(target.value)
        : target.value;

      const oldValue = Config[key];
      Config[key] = value;
      console.log(
        `updated ${key} to be ${value}, old value was: ${oldValue as string}`
      );
    }

    function renderConfig(configKey: ValidConfigKeys, configValue: any) {
      if (typeof configValue === 'object') return '';

      const className = isNaN(configValue as number) ? 'text' : 'number';
      return `
        <label for="${configKey}">${configKey}</label>
        <input id="${configKey}" class="${className}" type="text" value="${
        configValue as string
      }" />
      `;
    }

    const configDump = document.querySelector(this.CONFIG_CONTAINER)!;
    configDump.innerHTML = `
      <h3 style="margin-bottom: 0; ">Debug Config Values</h3>
      <div class="value-container" style="width: 100%; white-space: pre-line;">
       ${(Object.keys(Config) as ValidConfigKeys[])
         .map((key) => renderConfig(key, Config[key]))
         .join('\n')}
        <pre style="display: none">${JSON.stringify(Config, null, 2)}</pre>
      </div>
    `;

    document
      .querySelector('.value-container')!
      .addEventListener('change', handleConfigChange);

    // called when the scene is `stopped`
    this.events.on('shutdown', this.hideConfigs, this);
  }

  hideConfigs = () => {
    document.querySelector(this.CONFIG_CONTAINER)!.innerHTML = '';
  };
}
