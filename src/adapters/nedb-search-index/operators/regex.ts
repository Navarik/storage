export class RegexOperator {
   async compile([field, regex, options]: Array<any>){
    return {
      [field]: { $regex: new RegExp(regex, options) }
    }
  }
}
