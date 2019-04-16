import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { compile } from 'vue-template-compiler';

class Compiler {
  public main(...argv: string[]) {
    readdirSync(__dirname + '/src').filter(file => !/.+\.md/.test(file)).forEach((file, i, files) => {
      const stream = readFileSync(__dirname + `/src/${file}`).toString();
      const template = file.includes('vue') ? this.getTemplate(stream) : stream;
      const compiled = compile(template, { preserveWhitespace: false });
      let render = String(compiled.render)
        .replace(/_c\(/g, '\nh(')
        .replace(/_s/g, 'String')
        .replace(/\+?\"\\n\s+\"\+?/g, '')
        .replace(/\,\d\)/g, ')')
        .replace(/\"/g, '\'')
      render = this.removeFunctionClose(render, '_v')
      console.log(`${i + 1}/${files.length} files success`)
      writeFileSync(__dirname + `/dist/${file.split('.')[0]}.js`, render);
    })
  }

  getTemplate(text: string) {
    return text.slice(text.indexOf('<template>') + '<template>'.length, text.lastIndexOf('</template>'))
  }

  removeFunctionClose(text: string, functionName: string) {
    let origin = text;
    let index = 0;
    let lastIndex = 0;
    while (index > -1) {
      let countOpenRoundBracket = 0;
      let flag = false;
      lastIndex = index;
      index = origin.indexOf(`${functionName}(`)
      for (let i = index + 2; i < origin.length; i += 1) {
        if (origin[i] === '(') countOpenRoundBracket += 1;
        else if (origin[i] === ')') countOpenRoundBracket -= 1;
        if (countOpenRoundBracket > 0) {
          flag = true;
        }
        if (
          (countOpenRoundBracket === 0 && flag) || // 내부 중첩 함수 순회 끝나고 내 소괄호가 나온 경우
          (countOpenRoundBracket < 0 && i > index + 2) // 순회 시작 하자마자 바로 닫기를 만나버린 경우
          ) {
          const temp = origin.split('');
          if (lastIndex < index) {
            temp.splice(i, 1);
            temp.splice(index, 3);
          }
          origin = temp.join('');
          break
        }
      }
    }
    return origin;
  }
}

new Compiler().main(...process.argv.slice(2));

