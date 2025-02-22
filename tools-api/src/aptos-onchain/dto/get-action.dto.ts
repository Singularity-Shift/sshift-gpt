import { IActionFunction } from '@helpers';
import { ToolsNameList } from 'move-agent-kit_spiel';

export class GetActionDto {
  name: ToolsNameList;
  args: any[];
  onchain: boolean;

  static fromJson(json: IActionFunction): GetActionDto {
    return new GetActionDto(json.name, json.arguments);
  }

  constructor(name: ToolsNameList, args: string) {
    this.name = name;
    const values = JSON.parse(JSON.parse(args).input);
    this.args = Object.values(values);
    this.onchain = true;
  }
}
