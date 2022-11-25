import { Config, ValidConfigKeys } from '../configLoader';

export const title = 'config-debug-menu';

export class ConfigDebugMenu extends Phaser.Scene {
  constructor() {
    super(title);
  }

  create() {
    // this.input.on(
    //   Phaser.Input.Events.POINTER_DOWN as string,
    //   this.handleToggleMenu,
    //   this
    // );

    // this.input.keyboard.on(`keydown-BACKTICK`, this.handleToggleMenu, this);

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

    const configDump = document.querySelector('#config-debug')!;
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
  }

  // handleToggleMenu = () => {
  //   this.scene.stop();
  // };
}
