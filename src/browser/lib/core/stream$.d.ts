import { ISubscribable, ISubscriber } from "@thi.ng/rstream";
export declare const popstate$: ISubscribable<PopStateEvent>;
export declare const DOMContentLoaded$: ISubscribable<Event>;
export declare type NavigationObject = {
    target: {
        location: {
            href: string;
        };
    };
    currentTarget: HTMLElement | Document;
};
export declare const DOMnavigated$: ISubscriber<NavigationObject>;
