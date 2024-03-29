import * as API from "@-0/keys";
export declare const LOG_PROP: (PROP: string) => {
    sub$: string;
    args: any;
    reso: (acc: API.Accumulator, res: any) => any;
    erro: (acc: API.Accumulator, err: Error, out$: import("@thi.ng/rstream").PubSub<unknown, unknown, any>) => any;
} | {
    sub$: string;
    args: any;
    reso?: undefined;
    erro?: undefined;
};
