import { CategoryFaq } from 'src/common/enums/categoryFaq.enum';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('faqs')
export class Faq {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({name:"question"})
  question: string;

  @Column({name:"answer",type:"text"})
  answer: string;

  @Column({
    type: 'enum',
    name: 'category',
    enum: CategoryFaq,
    default: CategoryFaq.GENERAL,
  })
  category: CategoryFaq;

  @Column({ name: 'is_popular', default: false })
  isPopular: boolean;
}
