import { IActionFunction } from '@helpers';

export class GetActionDto {
  name: string;
  args: any[];
  onchain: boolean;

  static fromJson(json: IActionFunction): GetActionDto {
    return new GetActionDto(json.name, json.arguments);
  }

  constructor(name: string, args: string) {
    this.name = name;
    const values = JSON.parse(JSON.parse(args).input);
    this.args = Object.values(values);
    this.onchain = true;
  }
}
