import { ISubscribable, ISubscriber, PubSub } from "@thi.ng/rstream";
export declare type Accumulator = {
    [key: string | symbol]: unknown;
};
declare const ICO: {
    args: any;
    sub$: string;
    reso: (acc: Accumulator, res: any) => any;
    erro: (acc: Accumulator, err: Error, out$: PubSub<unknown, unknown, any>) => any;
};
export declare type ICommandObject = Partial<typeof ICO>;
declare const IC: {
    work: (args: any) => any;
    src$: ISubscriber<any> | ISubscribable<any>;
    args: any;
    sub$: string;
    reso: (acc: Accumulator, res: any) => any;
    erro: (acc: Accumulator, err: Error, out$: PubSub<unknown, unknown, any>) => any;
};
export declare type ICommand = Partial<typeof IC>;
export declare type Command = ICommandObject | HOTask;
export declare type HOTask = (acc: Accumulator) => Task;
export declare type Task = Command[];
declare const C: (data: any) => any;
export declare type Component = typeof C;
declare const PURL: {
    _FURL: string;
    _PATH: string[];
    _DOMN: string[];
    _SUBD: string[];
    _QERY: Record<string, unknown>;
    _HASH: string;
};
export declare type ParsedURL = Partial<typeof PURL>;
declare const HD: {
    title: string;
    og_description: string;
    og_image: string;
    og_image_width: string | number;
    og_image_height: string | number;
    favicon: string;
    og_type: string;
};
export declare type HeadData = Partial<typeof HD>;
declare const TDOM: {
    _NODE: HTMLElement | Document;
    body: any;
    head: Partial<{
        title: string;
        og_description: string;
        og_image: string;
        og_image_width: string | number;
        og_image_height: string | number;
        favicon: string;
        og_type: string;
    }>;
};
export declare type TargetDOM = Partial<typeof TDOM>;
declare const RHBD: {
    head: Partial<{
        title: string;
        og_description: string;
        og_image: string;
        og_image_width: string | number;
        og_image_height: string | number;
        favicon: string;
        og_type: string;
    }>;
    body: any;
};
export declare type RouterHeadBodyData = Partial<typeof RHBD>;
declare const RO: {
    _DATA: Partial<{
        head: Partial<{
            title: string;
            og_description: string;
            og_image: string;
            og_image_width: string | number;
            og_image_height: string | number;
            favicon: string;
            og_type: string;
        }>;
        body: any;
    }>;
    _PAGE: (data: any) => any;
};
export declare type RouterOutput = typeof RO;
export declare type Router = (url: string) => RouterOutput | Promise<RouterOutput>;
declare const RouterCMDInput: {
    _FURL: string;
    _NODE: HTMLElement | Document;
    POP_STATE: Record<string, unknown>;
};
export declare type RouterCommandArgs = Partial<typeof RouterCMDInput>;
declare const RC: {
    sub$: string;
    args: (args: RouterCommandArgs) => any;
};
export declare type RouterCommand = typeof RC;
declare const RCFG: {
    preroute: Command | Task;
    ignore_prefix: string | RegExp;
    postroute: Command | Task;
    router: Router;
};
export declare type RouterCFG = Partial<typeof RCFG>;
declare const DD: {
    $$_PATH: string[];
    $$_LOAD: boolean;
    $$_VIEW: (data: any) => any;
    $$_ROOT: HTMLElement | Document;
};
export declare type DefaultDraft = typeof DD;
export {};
