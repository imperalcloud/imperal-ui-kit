'use client';
import React, { useContext, useEffect } from 'react';
import type { UIAction, UIComponent } from '../types';
import { nodeIdentity, useSyncedState } from '../hooks';
import { useUIAction } from '../ImperalUIProvider';
import { FormContext } from './DForm';
import { Field } from './primitives';
export const DTextArea: UIComponent = ({ node, onAction }) => {
 const form=useContext(FormContext); const action=useUIAction(onAction); const {placeholder='',value:initial='',rows=4,on_submit,param_name='text',label,description,error,required=false,disabled=false,readonly=false}=node.props as {placeholder?:string;value?:string;rows?:number;on_submit?:UIAction;param_name?:string;label?:string;description?:string;error?:string;required?:boolean;disabled?:boolean;readonly?:boolean};
 const [local,setLocal]=useSyncedState(initial,nodeIdentity(node)); useEffect(()=>{if(form&&form.values[param_name]===undefined)form.setField(param_name,initial)},[form,initial,param_name]); const value=String(form?(form.values[param_name]??initial):local); const set=(next:string)=>form?form.setField(param_name,next):setLocal(next);
 return <Field label={label} description={description} error={error ?? (action.error instanceof Error?action.error.message:undefined)} required={required}>{ids=><textarea id={ids.id} aria-describedby={[ids.descriptionId,ids.errorId].filter(Boolean).join(' ')||undefined} aria-invalid={Boolean(error||action.error)} value={value} onChange={event=>set(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)&&on_submit){event.preventDefault();void action.run({...on_submit,params:{...(on_submit.params??{}),[param_name]:value}})}}} placeholder={placeholder} rows={Math.max(2,rows)} required={required} disabled={disabled||action.pending} readOnly={readonly} className={`control-base min-h-24 resize-y ${error?'control-error':''}`}/>}</Field>;
};
